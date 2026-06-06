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
  loopCrossings: Map<number, number>;
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

    const loopCrossings = existing?.loopCrossings ?? new Map<number, number>();

    /**
     * Store timestamp for THIS loop crossing
     */
    loopCrossings.set(event.timingLoopIndex, event.raceTime);

    const progressionScore =
      event.lap * this.totalTimingLoops + event.timingLoopIndex;

    this.driverStates.set(event.driver, {
      driver: event.driver,
      lap: event.lap,
      timingLoopIndex: event.timingLoopIndex,
      lastCrossingTime: event.raceTime,
      raceDistance: event.raceDistance,
      loopCrossings,
      progressionScore,
      gapToLeader: existing?.gapToLeader,
      intervalGap: existing?.intervalGap,
    });
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
    states.sort((a, b) => {
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

      /**
       * SECONDARY:
       * same-loop timestamp
       */
      return a.lastCrossingTime - b.lastCrossingTime;
    });

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
       * Compare SAME LOOP ONLY
       */
      const leaderLoopTime = leader.loopCrossings.get(current.timingLoopIndex);

      if (leaderLoopTime !== undefined) {
        current.gapToLeader = current.lastCrossingTime - leaderLoopTime;
      }

      /**
       * INTERVAL TO CAR AHEAD
       */
      const ahead = states[i - 1];

      /**
       * Compare SAME LOOP ONLY
       */
      const aheadLoopTime = ahead.loopCrossings.get(current.timingLoopIndex);

      if (aheadLoopTime !== undefined) {
        current.intervalGap = current.lastCrossingTime - aheadLoopTime;
      }
    }

    /**
     * Write updated states back into map
     */
    states.forEach((state) => {
      this.driverStates.set(state.driver, state);
    });
  }

  /* ===================================================== */
  /* ACCESSORS                                             */
  /* ===================================================== */

  getDriverState(driver: string): DriverTimingState | undefined {
    return this.driverStates.get(driver);
  }

  setTimingLoopCount(count: number): void {
    this.totalTimingLoops = count;
  }

  reset(): void {
    this.processedIndex = 0;

    this.driverStates.clear();

    this.timingStateSubject.next(new Map());
  }
}
