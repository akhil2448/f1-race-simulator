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
import {
  TimingEventProcessorService,
  DriverTimingState,
} from './timing-event-processor.service';
import { RaceFinishService } from './race-finish.service';
import { RaceApiResponse } from '../models/race-data.model';

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

  private raceData!: RaceApiResponse;

  initialize(raceData: RaceApiResponse): void {
    this.raceData = raceData;
  }

  /* ===============================
     STATE
     =============================== */

  private lastStableLeaderLap = 1;
  private timingClockTime = 0;

  /** when a driver retired */
  private outAtTime = new Map<string, number>();

  // FOR TOGGLE BUTTONS IN CONTROL ARE AFTER RACE ENDS
  private lastLiveEntries: LeaderboardEntry[] = [];

  constructor(
    private timing: LiveTimingService,
    private telemetry: TelemetryInterpolationService,
    private sectorVisual: LiveSectorVisualService,
    private clock: RaceClockService,
    private presence: DriverPresenceService,
    private timingEvents: TimingEventProcessorService,
    private raceFinish: RaceFinishService,
  ) {
    this.timing.state$.subscribe(() => {
      this.timingClockTime = this.clock.getCurrentSecond();
    });

    this.raceFinish.raceFinished$.subscribe((finished) => {
      this.raceFinished = finished;
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

    const authoritativeTiming = new Map<string, DriverTimingState>();
    let orderedTimingStates: DriverTimingState[] = [];

    /* ---------- TELEMETRY (visual only) ---------- */
    this.telemetry.interpolatedFrame$.subscribe((frame) => {
      if (!frame) return;
      latestTelemetry.clear();
      frame.cars.forEach((c) => latestTelemetry.set(c.driver, c));
    });

    /* ---------- FIA TIMING EVENTS ---------- */
    this.timingEvents.timingState$.subscribe((states) => {
      authoritativeTiming.clear();

      states.forEach((value, key) => {
        authoritativeTiming.set(key, value);
      });

      orderedTimingStates = this.timingEvents.getOrderedStates();
    });

    /* ---------- PRESENTATION STATE ---------- */
    this.sectorVisual.visualState$.subscribe((states: LiveDriverState[]) => {
      if (!states.length) return;

      /**
       * 🔒 FINAL CLASSIFICATION MODE
       *
       * Once race officially finishes:
       * - stop using live timing
       * - stop using telemetry ordering
       * - stop using interval engine
       *
       * Use ONLY backend FIA classification.
       */
      if (this.raceFinished) {
        this.subject.next({
          entries: this.buildFinalClassificationEntries(),

          leaderLap: this.subject.value.totalLaps,

          totalLaps: this.subject.value.totalLaps,

          raceFinished: true,
        });

        return;
      }

      const now = performance.now();

      const entries: LeaderboardEntry[] = [];

      const visualStateByDriver = new Map<string, LiveDriverState>();
      states.forEach((state) => visualStateByDriver.set(state.driver, state));

      const orderedStates: LiveDriverState[] = [];
      const orderedDrivers = new Set<string>();

      orderedTimingStates.forEach((timingState) => {
        const visualState = visualStateByDriver.get(timingState.driver);
        if (!visualState) return;

        orderedStates.push(visualState);
        orderedDrivers.add(timingState.driver);
      });

      states.forEach((state) => {
        if (!orderedDrivers.has(state.driver)) {
          orderedStates.push(state);
        }
      });

      orderedStates.forEach((s, index) => {
        const position = index + 1;
        // const prevPos = this.previousPositions.get(s.driver);
        const isOut = this.presence.isOut(s.driver);

        // record OUT time once
        if (isOut && !this.outAtTime.has(s.driver)) {
          this.outAtTime.set(s.driver, this.timingClockTime);
        }

        const t = latestTelemetry.get(s.driver);

        const officialTiming = authoritativeTiming.get(s.driver);

        /**
         * TimingEventProcessorService owns timing-event gaps.
         * LiveTimingService values remain as the existing fallback.
         */
        const entry: LeaderboardEntry = {
          position,
          driver: s.driver,
          lap: s.currentLap,

          gapToLeader: isOut
            ? null
            : (officialTiming?.gapToLeader ?? s.gapToLeader),

          intervalGap: isOut
            ? null
            : (officialTiming?.intervalGap ?? s.intervalGap),

          lapsDown: s.lapsDown,

          isInPit: s.isInPit,
          compound: s.compound,
          tyreLife: s.tyreLife,

          lapDistance: t?.lapDistance ?? 0,
          raceDistance: t?.raceDistance ?? 0,

          provisional: s.provisionalStatus,
          status: isOut ? 'OUT' : null,

          pitStops: this.getPitStopCount(s.driver, this.timingClockTime),
        };

        entries.push(entry);
      });

      /* OUT drivers sorted by retirement time */
      entries.forEach((e, i) => {
        e.position = i + 1;
      });

      // SAVE LAST LIVE DATA BEFORE FIA FINAL CLASSIFICATION TAKES OVER
      this.lastLiveEntries = entries.map((e) => ({ ...e }));

      /* leader lap stabilization */
      const rawLeaderLap = orderedStates[0].currentLap;
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

  /* =====================================================
     FINAL FIA OFFICIAL CLASSIFICATION
     ===================================================== */

  private buildFinalClassificationEntries(): LeaderboardEntry[] {
    const totalLaps = this.raceData.session.totalLaps;

    return this.raceData.results.classification.map((c) => {
      let displayGap = c.displayGap;

      /**
       * FIA terminal states
       */
      if (c.status === 'OUT') {
        displayGap = c.lapsDown >= totalLaps ? 'DNS' : 'DNF';
      }

      return {
        position: c.position,

        driver: c.driver,

        lap: c.lapsCompleted,

        /**
         * Official FIA classification values
         */
        gapToLeader: c.gapToLeader,

        intervalGap: null,

        lapsDown: c.lapsDown,

        /**
         * Preserve last live telemetry values
         * so control-area temporary modes still work
         */
        lapDistance: 0,

        raceDistance: 0,

        isInPit: false,

        compound:
          this.lastLiveEntries.find((e) => e.driver === c.driver)?.compound ??
          '',

        tyreLife:
          this.lastLiveEntries.find((e) => e.driver === c.driver)?.tyreLife ??
          null,

        pitStops: this.lastLiveEntries.find((e) => e.driver === c.driver)
          ?.pitStops,

        provisional: null,

        status: c.status === 'OUT' ? 'OUT' : null,

        /**
         * Final-classification-only fields
         */
        displayGap,

        points: c.points,

        isOfficialClassification: true,
      };
    });
  }

  getOfficialClassification() {
    return this.raceData.results.classification;
  }

  getDriverStandings() {
    return this.raceData.results.driverStandings;
  }

  getConstructorStandings() {
    return this.raceData.results.constructorStandings;
  }

  getFastestLap() {
    return this.raceData.results.fastestLap;
  }
}
