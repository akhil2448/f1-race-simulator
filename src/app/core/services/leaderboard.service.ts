import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SimulationEngineService } from './simulation-engine.service';
import { TelemetryFrame } from '../models/race-telemetry.model';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';
import { DriverStateService } from './driver-state.service';
import { DriverRaceState } from '../models/driver-state.model';

/* ===================================================== */
/* VIEW STATE MODEL                                      */
/* ===================================================== */

export interface LeaderboardViewState {
  entries: LeaderboardEntry[];
  leaderLap: number;
  totalLaps: number;
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  /* ===================================================== */
  /* STATE                                                */
  /* ===================================================== */

  private leaderboardSubject = new BehaviorSubject<LeaderboardViewState>({
    entries: [],
    leaderLap: 0,
    totalLaps: 0,
  });

  leaderboard$ = this.leaderboardSubject.asObservable();

  private previousFrame?: TelemetryFrame;
  private totalLaps = 0;

  /** Per-driver pit + tyre state */
  private driverState = new Map<string, DriverRaceState>();

  /**
   * Stores last stable time gaps (leader-relative).
   * Used to FREEZE gaps when leader is in pit.
   */
  private lastStableGaps = new Map<string, number>();

  /**
   * Tracks current leader.
   * Needed to RESET gap cache when leader changes.
   */
  private lastLeader?: string;

  constructor(
    private engine: SimulationEngineService,
    private driverStateService: DriverStateService
  ) {
    /* ---------- TELEMETRY STREAM ---------- */
    this.engine.frame$.subscribe((frame) => {
      if (!frame || !frame.cars.length) return;

      if (this.previousFrame) {
        this.updateLeaderboard(this.previousFrame, frame);
      } else {
        // First frame (important for pit-lane start)
        this.updateLeaderboard(frame, frame);
      }

      this.previousFrame = frame;
    });

    /* ---------- DRIVER STATE STREAM ---------- */
    this.driverStateService.driverState$.subscribe((state) => {
      this.driverState = state;
    });
  }

  /* ===================================================== */
  /* EXTERNAL SETTERS                                      */
  /* ===================================================== */

  /** Called ONCE after race data is loaded */
  setTotalLaps(totalLaps: number): void {
    this.totalLaps = totalLaps;

    // Update view state without touching entries
    const current = this.leaderboardSubject.value;
    this.leaderboardSubject.next({
      ...current,
      totalLaps,
    });
  }

  /* ===================================================== */
  /* CORE LOGIC                                           */
  /* ===================================================== */

  private updateLeaderboard(prev: TelemetryFrame, curr: TelemetryFrame): void {
    /* ---------- SORT BY RACE DISTANCE ---------- */
    const sorted = [...curr.cars].sort((a, b) => b.distance - a.distance);
    const leader = sorted[0];

    /* ---------- LEADER CHANGE DETECTION ---------- */
    if (this.lastLeader && this.lastLeader !== leader.driver) {
      /**
       * Leader changed (e.g. old leader pitted and got overtaken).
       * Any cached gaps are now INVALID because they were relative
       * to the old leader.
       */
      this.lastStableGaps.clear();
    }
    this.lastLeader = leader.driver;

    /* ---------- LEADER SPEED (m/s) ---------- */
    const prevLeader = prev.cars.find((c) => c.driver === leader.driver);
    const leaderSpeed = prevLeader ? leader.distance - prevLeader.distance : 0;

    /* ---------- LEADER PIT STATE ---------- */
    const leaderState = this.driverState.get(leader.driver);
    const leaderInPit = leaderState?.isInPit === true;

    /* ---------- BUILD LEADERBOARD ROWS ---------- */
    const entries: LeaderboardEntry[] = sorted.map((car, index) => {
      const distanceGap = leader.distance - car.distance;
      const state = this.driverState.get(car.driver);

      let gapToLeader = 0;

      if (index === 0) {
        // Leader always has zero gap
        gapToLeader = 0;
      } else if (leaderInPit || leaderSpeed <= 0) {
        /**
         * Leader is in pit (or speed invalid).
         * Freeze gaps to last known stable value.
         * Matches real F1 broadcast timing behavior.
         */
        gapToLeader = this.lastStableGaps.get(car.driver) ?? 0;
      } else {
        /**
         * Normal racing condition:
         * Convert distance gap → time gap using leader speed.
         */
        gapToLeader = distanceGap / leaderSpeed;

        // Cache stable gap for future pit scenarios
        this.lastStableGaps.set(car.driver, gapToLeader);
      }

      return {
        position: index + 1,
        driver: car.driver,
        lap: car.lap,
        distance: car.distance,
        gapToLeader,
        isInPit: state?.isInPit ?? false,
        compound: state?.currentCompound ?? 'UNKNOWN',
      };
    });

    /* ---------- EMIT VIEW STATE ---------- */
    this.leaderboardSubject.next({
      entries,
      leaderLap: leader.lap,
      totalLaps: this.totalLaps,
    });
  }
}
