import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SimulationEngineService } from './simulation-engine.service';
import { TelemetryFrame } from '../models/race-telemetry.model';
import { GapMode, LeaderboardEntry } from '../models/leaderboard-entry.model';
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

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private leaderboardSubject = new BehaviorSubject<LeaderboardViewState>({
    entries: [],
    leaderLap: 0,
    totalLaps: 0,
  });

  leaderboard$ = this.leaderboardSubject.asObservable();

  private previousFrame?: TelemetryFrame;
  private totalLaps = 0;

  private driverState = new Map<string, DriverRaceState>();
  private previousPositions = new Map<string, number>();
  private lastStableGaps = new Map<string, number>();

  private arrowMap = new Map<
    string,
    { arrow: 'up' | 'down'; expiresAt: number }
  >();

  private readonly ARROW_DURATION = 500;

  private tyreLifeMap = new Map<string, Map<number, number>>();

  private pitStopCount = new Map<string, number>();
  private wasInPit = new Map<string, boolean>();
  private raceStarted = false;

  constructor(
    private engine: SimulationEngineService,
    private driverStateService: DriverStateService,
  ) {
    this.engine.frame$.subscribe((frame) => {
      if (!frame || !frame.cars.length) return;
      this.updateLeaderboard(this.previousFrame ?? frame, frame);
      this.previousFrame = frame;
    });

    this.driverStateService.driverState$.subscribe((state) => {
      this.driverState = state;
    });
  }

  setTotalLaps(totalLaps: number): void {
    this.totalLaps = totalLaps;
  }

  initializeTyreLife(drivers: Record<string, any>): void {
    this.tyreLifeMap.clear();

    Object.entries(drivers).forEach(([driverCode, data]: any) => {
      const lapMap = new Map<number, number>();

      data.laps?.forEach((lap: any) => {
        if (lap.LapNumber != null && lap.TyreLife != null) {
          lapMap.set(lap.LapNumber, lap.TyreLife);
        }
      });

      this.tyreLifeMap.set(driverCode, lapMap);
    });
  }

  private lastLeader?: string;

  private updateLeaderboard(prev: TelemetryFrame, curr: TelemetryFrame): void {
    const now = performance.now();

    // Check if any cars are starting race from PitLane
    if (!this.raceStarted && curr.cars.some((c) => c.lap > 1)) {
      this.raceStarted = true;
    }

    /* ---------- SORT BY DISTANCE ---------- */
    const sorted = [...curr.cars].sort((a, b) => b.distance - a.distance);
    const leader = sorted[0];

    /* ---------- LEADER CHANGE DETECTION ---------- */
    if (this.lastLeader && this.lastLeader !== leader.driver) {
      // Leader changed → gaps relative to old leader are invalid
      this.lastStableGaps.clear();
    }
    this.lastLeader = leader.driver;

    /* ---------- LEADER STATE ---------- */
    const leaderState = this.driverState.get(leader.driver);
    const leaderInPit = leaderState?.isInPit === true;

    const prevLeader = prev.cars.find((c) => c.driver === leader.driver);
    const leaderSpeed =
      prevLeader && leader.distance > prevLeader.distance
        ? leader.distance - prevLeader.distance
        : 0;

    const entries: LeaderboardEntry[] = [];

    sorted.forEach((car, index) => {
      const position = index + 1;
      const prevPosition = this.previousPositions.get(car.driver);
      const state = this.driverState.get(car.driver);
      const tyreLife = this.tyreLifeMap.get(car.driver)?.get(car.lap);

      /* ---------- GAP CALC ---------- */
      let gapToLeader = 0;
      let intervalGap = 0;

      if (position === 1) {
        gapToLeader = 0;
        intervalGap = 0;
      } else if (leaderInPit || leaderSpeed <= 0) {
        // 🔒 FREEZE gaps
        gapToLeader = this.lastStableGaps.get(car.driver) ?? 0;
      } else {
        // 🟢 Normal racing
        gapToLeader = (leader.distance - car.distance) / leaderSpeed;
        this.lastStableGaps.set(car.driver, gapToLeader);

        const prevCar = sorted[index - 1];
        intervalGap = (prevCar.distance - car.distance) / leaderSpeed;
      }

      /* ---------- POSITION ARROW ---------- */
      if (prevPosition !== undefined && prevPosition !== position) {
        this.arrowMap.set(car.driver, {
          arrow: position < prevPosition ? 'up' : 'down',
          expiresAt: now + this.ARROW_DURATION,
        });
      }

      let positionArrow: 'up' | 'down' | undefined;
      const flash = this.arrowMap.get(car.driver);
      if (flash && flash.expiresAt > now) {
        positionArrow = flash.arrow;
      }

      this.previousPositions.set(car.driver, position);

      /* ---------- COUNT PITSTOPS ---------- */
      const wasInPitBefore = this.wasInPit.get(car.driver) ?? false;
      const isInPitNow = state?.isInPit === true;

      // Initialize counter if missing
      if (!this.pitStopCount.has(car.driver)) {
        this.pitStopCount.set(car.driver, 0);
      }

      // Count ONLY transition OUT → IN after race start
      if (this.raceStarted && !wasInPitBefore && isInPitNow) {
        this.pitStopCount.set(
          car.driver,
          (this.pitStopCount.get(car.driver) ?? 0) + 1,
        );
      }

      // Save state for next frame
      this.wasInPit.set(car.driver, isInPitNow);

      entries.push({
        position,
        driver: car.driver,
        lap: car.lap,
        distance: car.distance,
        gapToLeader,
        intervalGap,
        isInPit: state?.isInPit ?? false,
        compound: state?.currentCompound ?? 'UNKNOWN',
        positionArrow,
        tyreLife,
        pitStops: this.pitStopCount.get(car.driver) ?? 0,
      });
    });

    this.leaderboardSubject.next({
      entries,
      leaderLap: leader.lap,
      totalLaps: this.totalLaps,
    });
  }
}
