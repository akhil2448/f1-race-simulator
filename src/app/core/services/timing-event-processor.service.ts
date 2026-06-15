import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { RaceClockService } from './race-clock-service';
import { TelemetryBufferService } from './race-telemetry-buffer.service';
import { TimingEvent } from '../models/timing-event.model';

export interface DriverTimingState {
  driver: string;
  lap: number;
  timingLoopIndex: number;
  lastCrossingTime: number;
  raceDistance: number;
  lapLoopCrossings: Map<number, Map<number, number>>;
  progressionScore?: number;
  gapToLeader?: number;
  intervalGap?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TimingEventProcessorService {
  /**
   * Latest processed timing-event index
   */
  private processedIndex = 0;
  private totalTimingLoops = 60;

  /**
   * Latest timing state per driver
   */
  private driverStates = new Map<string, DriverTimingState>();
  private orderedStates: DriverTimingState[] = [];

  /**
   * Reactive timing state
   */
  private timingStateSubject = new BehaviorSubject<
    Map<string, DriverTimingState>
  >(new Map());

  timingState$ = this.timingStateSubject.asObservable();

  constructor(
    private raceClock: RaceClockService,
    private telemetryBuffer: TelemetryBufferService,
  ) {
    /**
     * Consume timing events continuously
     * as race clock advances.
     */
    this.raceClock.raceTime$.subscribe((raceSecond) => {
      this.processEventsUpTo(raceSecond);
    });
  }

  /* ===================================================== */
  /* PROCESS EVENTS                                        */
  /* ===================================================== */

  private processEventsUpTo(raceSecond: number): void {
    const events = this.telemetryBuffer.getTimingEvents();

    while (this.processedIndex < events.length) {
      const event = events[this.processedIndex];

      // Future event → stop processing
      if (event.raceTime > raceSecond) {
        break;
      }

      this.applyEvent(event);
      this.recomputeIntervals();

      this.processedIndex++;
    }

    /**
     * Emit cloned map so Angular change detection fires
     */
    this.timingStateSubject.next(new Map(this.driverStates));
  }

  /* ===================================================== */
  /* APPLY SINGLE EVENT                                    */
  /* ===================================================== */

  private applyEvent(event: TimingEvent): void {
    const existing = this.driverStates.get(event.driver);

    const lapLoopCrossings =
      existing?.lapLoopCrossings ?? new Map<number, Map<number, number>>();

    const lapCrossings =
      lapLoopCrossings.get(event.lap) ?? new Map<number, number>();

    lapCrossings.set(event.timingLoopIndex, event.raceTime);

    lapLoopCrossings.set(event.lap, lapCrossings);

    const progressionScore =
      event.lap * this.totalTimingLoops + event.timingLoopIndex;

    this.driverStates.set(event.driver, {
      driver: event.driver,
      lap: event.lap,
      timingLoopIndex: event.timingLoopIndex,
      lastCrossingTime: event.raceTime,
      raceDistance: event.raceDistance,
      lapLoopCrossings,
      progressionScore,
      gapToLeader: existing?.gapToLeader,
      intervalGap: existing?.intervalGap,
    });
  }

  private getEquivalentCrossingTime(
    reference: DriverTimingState,
    targetLap: number,
    targetLoop: number,
  ): number | undefined {
    const lapMap = reference.lapLoopCrossings.get(targetLap);

    if (!lapMap) {
      return undefined;
    }

    /**
     * Exact loop match
     */
    const exact = lapMap.get(targetLoop);

    if (exact !== undefined) {
      return exact;
    }

    /**
     * Fallback:
     * search previous loops
     *
     * Prevents tiny edge gaps
     * when exact loop not yet stored.
     */
    for (let loop = targetLoop - 1; loop >= 0; loop--) {
      const fallback = lapMap.get(loop);

      if (fallback !== undefined) {
        return fallback;
      }
    }

    return undefined;
  }

  /* ===================================================== */
  /* FIA INTERVAL ENGINE                                   */
  /* ===================================================== */

  private recomputeIntervals(): void {
    const states = Array.from(this.driverStates.values());

    /**
     * Sort by:
     * 1. lap
     * 2. timing loop
     * 3. crossing time
     */
    states.sort((a, b) => this.compareTimingStates(a, b));

    if (!states.length) return;

    const leader = states[0];

    for (let i = 0; i < states.length; i++) {
      const current = states[i];

      /**
       * LEADER
       */
      if (i === 0) {
        current.gapToLeader = 0;
        current.intervalGap = 0;
        continue;
      }

      /**
       * GAP TO LEADER
       */
      const leaderEquivalentTime = this.getEquivalentCrossingTime(
        leader,
        current.lap,
        current.timingLoopIndex,
      );

      if (leaderEquivalentTime !== undefined) {
        const equivalentGap = current.lastCrossingTime - leaderEquivalentTime;

        const leaderElapsedSinceEquivalent =
          leader.lastCrossingTime - leaderEquivalentTime;

        current.gapToLeader = equivalentGap + leaderElapsedSinceEquivalent;
      }

      /**
       * INTERVAL TO CAR AHEAD
       */
      const ahead = states[i - 1];

      const aheadEquivalentTime = this.getEquivalentCrossingTime(
        ahead,
        current.lap,
        current.timingLoopIndex,
      );

      if (aheadEquivalentTime !== undefined) {
        const equivalentGap = current.lastCrossingTime - aheadEquivalentTime;

        const aheadElapsedSinceEquivalent =
          ahead.lastCrossingTime - aheadEquivalentTime;

        current.intervalGap = equivalentGap + aheadElapsedSinceEquivalent;
      }
    }

    /**
     * Write updated states back into map
     */
    states.forEach((state) => {
      this.driverStates.set(state.driver, state);
    });

    this.orderedStates = [...states];
  }

  private compareTimingStates(
    a: DriverTimingState,
    b: DriverTimingState,
  ): number {
    /**
     * PRIMARY:
     * official timing-loop progression
     */
    const progressionDelta =
      (b.progressionScore ?? 0) - (a.progressionScore ?? 0);

    /**
     * Different timing progression:
     * FIA timing loops remain authoritative
     */
    if (progressionDelta !== 0) {
      return progressionDelta;
    }

    /**
     * SAME LOOP:
     * allow meaningful RaceDistance crossover
     *
     * Prevents pit-stop freeze while
     * avoiding normal racing jitter.
     */
    const distanceDelta = b.raceDistance - a.raceDistance;

    /**
     * Require meaningful crossover
     * (~25m threshold)
     */
    if (Math.abs(distanceDelta) > 25) {
      return distanceDelta;
    }

    /**
     * FINAL fallback:
     * same-loop crossing timestamp
     */
    return a.lastCrossingTime - b.lastCrossingTime;
  }

  /* ===================================================== */
  /* ACCESSORS                                             */
  /* ===================================================== */

  getDriverState(driver: string): DriverTimingState | undefined {
    return this.driverStates.get(driver);
  }

  getOrderedStates(): DriverTimingState[] {
    return [...this.orderedStates];
  }

  setTimingLoopCount(count: number): void {
    this.totalTimingLoops = count;
  }

  reset(): void {
    this.processedIndex = 0;

    this.driverStates.clear();
    this.orderedStates = [];

    this.timingStateSubject.next(new Map());
  }
}
