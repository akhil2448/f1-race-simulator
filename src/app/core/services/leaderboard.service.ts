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

  /** Previous leaderboard positions */
  private previousPositions = new Map<string, number>();

  /** Arrow flash cache */
  private arrowMap = new Map<
    string,
    { arrow: 'up' | 'down'; expiresAt: number }
  >();

  private readonly ARROW_DURATION = 1500; // ms

  constructor(
    private engine: SimulationEngineService,
    private driverStateService: DriverStateService
  ) {
    /* ---------- TELEMETRY ---------- */
    this.engine.frame$.subscribe((frame) => {
      if (!frame || !frame.cars.length) return;

      this.updateLeaderboard(this.previousFrame ?? frame, frame);
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

  setTotalLaps(totalLaps: number): void {
    this.totalLaps = totalLaps;
    this.leaderboardSubject.next({
      ...this.leaderboardSubject.value,
      totalLaps,
    });
  }

  /* ===================================================== */
  /* CORE LOGIC                                           */
  /* ===================================================== */

  private updateLeaderboard(prev: TelemetryFrame, curr: TelemetryFrame): void {
    const now = performance.now();

    /* ---------- SORT BY DISTANCE ---------- */
    const sorted = [...curr.cars].sort((a, b) => b.distance - a.distance);
    const leader = sorted[0];

    const entries: LeaderboardEntry[] = [];

    sorted.forEach((car, index) => {
      const position = index + 1;
      const prevPosition = this.previousPositions.get(car.driver);
      const state = this.driverState.get(car.driver);

      /* ---------- POSITION CHANGE ---------- */
      if (prevPosition !== undefined && prevPosition !== position) {
        this.arrowMap.set(car.driver, {
          arrow: position < prevPosition ? 'up' : 'down',
          expiresAt: now + this.ARROW_DURATION,
        });
      }

      /* ---------- READ & EXPIRE ARROW ---------- */
      let positionArrow: 'up' | 'down' | undefined;
      const flash = this.arrowMap.get(car.driver);

      if (flash) {
        if (flash.expiresAt >= now) {
          positionArrow = flash.arrow;
        } else {
          this.arrowMap.delete(car.driver);
        }
      }

      this.previousPositions.set(car.driver, position);

      entries.push({
        position,
        driver: car.driver,
        lap: car.lap,
        distance: car.distance,
        gapToLeader: 0, // unchanged from your existing logic
        isInPit: state?.isInPit ?? false,
        compound: state?.currentCompound ?? 'UNKNOWN',
        positionArrow,
      });
    });

    this.leaderboardSubject.next({
      entries,
      leaderLap: leader.lap,
      totalLaps: this.totalLaps,
    });
  }
}
