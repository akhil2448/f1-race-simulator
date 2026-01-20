import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LiveTimingService } from './live-timing.service';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';
import { TelemetryInterpolationService } from './telemetry-interpolation.service';
import { LiveTelemetryVisualTimingService } from './live-telemetry-visual-timing.service';
import { LiveDriverState } from '../models/live-driver-state.model';
import { LiveSectorVisualService } from './live-sector-visual.service';

export interface LeaderboardViewState {
  entries: LeaderboardEntry[];
  leaderLap: number;
  totalLaps: number;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private subject = new BehaviorSubject<LeaderboardViewState>({
    entries: [],
    leaderLap: 1, // 🔒 never start at 0
    totalLaps: 0,
  });

  leaderboard$ = this.subject.asObservable();

  private arrowMap = new Map<
    string,
    { arrow: 'up' | 'down'; expiresAt: number }
  >();

  private previousPositions = new Map<string, number>();
  private readonly ARROW_DURATION = 500;

  /** 🔒 LAST STABLE LEADER LAP (key fix) */
  private lastStableLeaderLap = 1;

  constructor(
    private timing: LiveTimingService,
    private telemetry: TelemetryInterpolationService,
    private sectorVisual: LiveSectorVisualService,
    //private visualTiming: LiveVisualTimingService,
  ) {
    this.bind();
  }

  setTotalLaps(totalLaps: number): void {
    const current = this.subject.value;
    this.subject.next({ ...current, totalLaps });
  }

  /* =====================================================
     CORE BINDING
     ===================================================== */

  private bind(): void {
    let latestTelemetry: Map<string, any> = new Map();

    /* ---------- TELEMETRY (visual only) ---------- */
    this.telemetry.interpolatedFrame$.subscribe((frame) => {
      if (!frame) return;

      latestTelemetry.clear();
      frame.cars.forEach((c) => latestTelemetry.set(c.driver, c));
    });

    /* ---------- TIMING (authoritative) ---------- */
    this.sectorVisual.visualState$.subscribe((states: LiveDriverState[]) => {
      // console.log(
      //   '[LEADERBOARD]',
      //   'P1 gap',
      //   states[1]?.gapToLeader,
      //   'interval',
      //   states[1]?.intervalGap,
      // );
      if (!states.length) return;

      const now = performance.now();
      const entries: LeaderboardEntry[] = [];

      states.forEach((s, index) => {
        const position = index + 1;
        const prevPos = this.previousPositions.get(s.driver);

        /* ---------- POSITION ARROW ---------- */
        if (prevPos !== undefined && prevPos !== position) {
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
          compound: 'UNKNOWN',

          lapDistance: t?.lapDistance ?? 0,
          raceDistance: t?.raceDistance ?? 0,

          provisional: s.provisionalStatus,

          positionArrow,
          tyreLife: undefined,
          pitStops: 0,
        });
      });

      /* =================================================
         🔒 LEADER LAP STABILIZATION (F1-correct)
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
}
