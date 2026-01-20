import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LiveTimingService } from './live-timing.service';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';
import { TelemetryInterpolationService } from './telemetry-interpolation.service';
import { LiveDriverState } from '../models/live-driver-state.model';
import { LiveSectorVisualService } from './live-sector-visual.service';
import { RaceClockService } from './race-clock-service';

export interface LeaderboardViewState {
  entries: LeaderboardEntry[];
  leaderLap: number;
  totalLaps: number;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private subject = new BehaviorSubject<LeaderboardViewState>({
    entries: [],
    leaderLap: 1,
    totalLaps: 0,
  });

  leaderboard$ = this.subject.asObservable();

  /* ===============================
     POSITION ARROWS
     =============================== */

  private arrowMap = new Map<
    string,
    { arrow: 'up' | 'down'; expiresAt: number }
  >();

  private previousPositions = new Map<string, number>();
  private readonly ARROW_DURATION = 500;

  /* ===============================
     STATE
     =============================== */

  private lastStableLeaderLap = 1;
  private timingClockTime = 0;

  constructor(
    private timing: LiveTimingService,
    private telemetry: TelemetryInterpolationService,
    private sectorVisual: LiveSectorVisualService,
    private clock: RaceClockService,
  ) {
    this.timing.state$.subscribe(() => {
      this.timingClockTime = this.clock.getCurrentSecond();
    });

    this.bind();
  }

  setTotalLaps(totalLaps: number): void {
    this.subject.next({ ...this.subject.value, totalLaps });
  }

  /* =====================================================
     CORE BINDING
     ===================================================== */

  private bind(): void {
    const latestTelemetry = new Map<string, any>();

    /* ---------- TELEMETRY (visual only) ---------- */
    this.telemetry.interpolatedFrame$.subscribe((frame) => {
      if (!frame) return;
      latestTelemetry.clear();
      frame.cars.forEach((c) => latestTelemetry.set(c.driver, c));
    });

    /* ---------- TIMING (authoritative) ---------- */
    this.sectorVisual.visualState$.subscribe((states: LiveDriverState[]) => {
      if (!states.length) return;

      const now = performance.now();
      const entries: LeaderboardEntry[] = [];

      states.forEach((s, index) => {
        const position = index + 1;
        const prevPos = this.previousPositions.get(s.driver);

        /* =================================================
           🔒 POSITION ARROW (MID-LAP ONLY)
           ================================================= */

        const isMidLap = s.gapToLeader !== null || s.intervalGap !== null;

        if (isMidLap && prevPos !== undefined && prevPos !== position) {
          this.arrowMap.set(s.driver, {
            arrow: position < prevPos ? 'up' : 'down',
            expiresAt: now + this.ARROW_DURATION,
          });
        }

        const arrowState = this.arrowMap.get(s.driver);
        const positionArrow =
          arrowState && arrowState.expiresAt > now
            ? arrowState.arrow
            : undefined;

        this.previousPositions.set(s.driver, position);

        const t = latestTelemetry.get(s.driver);

        entries.push({
          position,
          driver: s.driver,
          lap: s.currentLap,

          gapToLeader: s.gapToLeader,
          intervalGap: s.intervalGap,
          lapsDown: s.lapsDown,

          isInPit: s.isInPit,
          compound: s.compound,
          tyreLife: s.tyreLife,

          lapDistance: t?.lapDistance ?? 0,
          raceDistance: t?.raceDistance ?? 0,

          provisional: s.provisionalStatus,
          positionArrow,

          pitStops: this.getPitStopCount(s.driver, this.timingClockTime),
        });
      });

      /* =================================================
         🔒 LEADER LAP STABILIZATION
         ================================================= */

      const rawLeaderLap = states[0].currentLap;
      const leaderLap =
        rawLeaderLap && rawLeaderLap >= 1
          ? rawLeaderLap
          : this.lastStableLeaderLap;

      this.lastStableLeaderLap = leaderLap;

      this.subject.next({
        entries,
        leaderLap,
        totalLaps: this.subject.value.totalLaps,
      });
    });
  }

  /* =====================================================
     PIT STOPS (AUTHORITATIVE)
     ===================================================== */

  private getPitStopCount(driver: string, raceTime: number): number {
    const driverData = (this.timing as any).raceData?.drivers?.[driver];
    if (!driverData) return 0;

    const pitStops = driverData.timing.pitStops ?? [];

    return pitStops.filter((p: any) => {
      if (p.pitOutTime == null) return false;
      if (raceTime < p.pitOutTime) return false;
      if (p.lap === 1 && p.pitInTime == null) return false; // pit-lane start
      return true;
    }).length;
  }
}
