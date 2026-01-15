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
  /* ---------- STATE ---------- */

  private leaderboardSubject = new BehaviorSubject<LeaderboardViewState>({
    entries: [],
    leaderLap: 0,
    totalLaps: 0,
  });

  leaderboard$ = this.leaderboardSubject.asObservable();

  private previousFrame?: TelemetryFrame;
  private driverState = new Map<string, DriverRaceState>();
  private totalLaps = 0;

  constructor(
    private engine: SimulationEngineService,
    private driverStateService: DriverStateService
  ) {
    /* ---------- TELEMETRY ---------- */
    this.engine.frame$.subscribe((frame) => {
      if (!frame || !frame.cars.length) return;

      if (this.previousFrame) {
        this.updateLeaderboard(this.previousFrame, frame);
      } else {
        // FIRST FRAME (important for pit-lane start)
        this.updateLeaderboard(frame, frame);
      }

      this.previousFrame = frame;
    });

    /* ---------- DRIVER STATE ---------- */
    this.driverStateService.driverState$.subscribe((state) => {
      this.driverState = state;
    });
  }

  /* ===================================================== */
  /* EXTERNAL SETTERS                                      */
  /* ===================================================== */

  /** Called ONCE from orchestration component */
  setTotalLaps(totalLaps: number): void {
    this.totalLaps = totalLaps;

    // update existing state without touching entries
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
    /* ---------- SORT BY DISTANCE ---------- */
    const sorted = [...curr.cars].sort((a, b) => b.distance - a.distance);
    const leader = sorted[0];

    /* ---------- LEADER SPEED ---------- */
    const prevLeader = prev.cars.find((c) => c.driver === leader.driver);
    const leaderSpeed = prevLeader ? leader.distance - prevLeader.distance : 0;

    /* ---------- BUILD ROWS ---------- */
    const entries: LeaderboardEntry[] = sorted.map((car, index) => {
      const distanceGap = leader.distance - car.distance;

      const gapToLeader =
        index === 0 || leaderSpeed <= 0 ? 0 : distanceGap / leaderSpeed;

      const state = this.driverState.get(car.driver);

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
