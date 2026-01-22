import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { LiveTimingService } from './live-timing.service';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';
import { TelemetryInterpolationService } from './telemetry-interpolation.service';
import { LiveDriverState } from '../models/live-driver-state.model';
import { LiveSectorVisualService } from './live-sector-visual.service';
import { RaceClockService } from './race-clock-service';
import { DriverPresenceService } from './driver-presence.service';

export interface LeaderboardViewState {
  entries: LeaderboardEntry[];
  leaderLap: number;
  totalLaps: number;
  raceFinished: boolean;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private subject = new BehaviorSubject<LeaderboardViewState>({
    entries: [],
    leaderLap: 1,
    totalLaps: 0,
    raceFinished: false,
  });

  leaderboard$ = this.subject.asObservable();

  /** leader lap observable */
  leaderLap$ = this.leaderboard$.pipe(map((s) => s.leaderLap));

  private raceFinished = false;

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

  /** when a driver retired */
  private outAtTime = new Map<string, number>();

  constructor(
    private timing: LiveTimingService,
    private telemetry: TelemetryInterpolationService,
    private sectorVisual: LiveSectorVisualService,
    private clock: RaceClockService,
    private presence: DriverPresenceService,
  ) {
    this.timing.state$.subscribe((states) => {
      if (states.length && states[0].isFinished) {
        this.raceFinished = true;
      }

      this.timingClockTime = this.clock.getCurrentSecond();
    });

    this.bind();
  }

  setTotalLaps(totalLaps: number): void {
    this.subject.next({
      ...this.subject.value,
      totalLaps,
    });
  }

  /** sync access if needed */
  getLeaderLap(): number {
    return this.subject.value.leaderLap;
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

      const activeEntries: LeaderboardEntry[] = [];
      const outEntries: LeaderboardEntry[] = [];

      states.forEach((s, index) => {
        const position = index + 1;
        const prevPos = this.previousPositions.get(s.driver);
        const isOut = this.presence.isOut(s.driver);

        // record OUT time once
        if (isOut && !this.outAtTime.has(s.driver)) {
          this.outAtTime.set(s.driver, this.timingClockTime);
        }

        /* 🔒 POSITION ARROWS (mid-lap only) */
        const isMidLap =
          !isOut && (s.gapToLeader !== null || s.intervalGap !== null);

        if (isMidLap && prevPos !== undefined && prevPos !== position) {
          this.arrowMap.set(s.driver, {
            arrow: position < prevPos ? 'up' : 'down',
            expiresAt: now + this.ARROW_DURATION,
          });
        }

        const arrowState = this.arrowMap.get(s.driver);
        const positionArrow =
          !isOut && arrowState && arrowState.expiresAt > now
            ? arrowState.arrow
            : undefined;

        this.previousPositions.set(s.driver, position);

        const t = latestTelemetry.get(s.driver);

        /** 🔑 IMPORTANT:
         *  We DO NOT modify gap logic here.
         *  LiveTimingService already decided what is valid.
         */
        const entry: LeaderboardEntry = {
          position,
          driver: s.driver,
          lap: s.currentLap,

          gapToLeader: isOut ? null : s.gapToLeader,
          intervalGap: isOut ? null : s.intervalGap,

          lapsDown: s.lapsDown,

          isInPit: s.isInPit,
          compound: s.compound,
          tyreLife: s.tyreLife,

          lapDistance: t?.lapDistance ?? 0,
          raceDistance: t?.raceDistance ?? 0,

          provisional: s.provisionalStatus,
          status: isOut ? 'OUT' : null,
          positionArrow,

          pitStops: this.getPitStopCount(s.driver, this.timingClockTime),
        };

        if (isOut) {
          outEntries.push(entry);
        } else {
          activeEntries.push(entry);
        }
      });

      /* OUT drivers sorted by retirement time */
      outEntries.sort((a, b) => {
        const ta = this.outAtTime.get(a.driver) ?? 0;
        const tb = this.outAtTime.get(b.driver) ?? 0;
        return ta - tb;
      });

      const entries = [...activeEntries, ...outEntries].map((e, i) => ({
        ...e,
        position: i + 1,
      }));

      /* leader lap stabilization */
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
        raceFinished: this.raceFinished,
      });
    });
  }

  /* =====================================================
     PIT STOPS
     ===================================================== */

  private getPitStopCount(driver: string, raceTime: number): number {
    const driverData = (this.timing as any).raceData?.drivers?.[driver];
    if (!driverData) return 0;

    const pitStops = driverData.timing.pitStops ?? [];

    return pitStops.filter((p: any) => {
      if (p.pitOutTime == null) return false;
      if (raceTime < p.pitOutTime) return false;
      if (p.lap === 1 && p.pitInTime == null) return false;
      return true;
    }).length;
  }
}
