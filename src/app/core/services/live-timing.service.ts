import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  DriverApiData,
  RaceApiResponse,
  TimingLapApi,
} from '../models/race-data.model';
import { RaceClockService } from './race-clock-service';
import { LiveDriverState } from '../models/live-driver-state.model';
import { SectorAnchorService } from './sector-anchor.service';

@Injectable({ providedIn: 'root' })
export class LiveTimingService {
  private raceData!: RaceApiResponse;

  private stateSubject = new BehaviorSubject<LiveDriverState[]>([]);
  state$ = this.stateSubject.asObservable();

  private lastKnownPosition = new Map<string, number>();
  private timingOrdered: LiveDriverState[] = [];
  private displayOrdered: LiveDriverState[] = [];
  private lastLeaderCompletedLaps = -1;

  // 🔒 Prevent mid-lap ping-pong swaps
  private provisionalSwapLatch = new Set<string>();

  constructor(
    private clock: RaceClockService,
    private sectorAnchors: SectorAnchorService,
  ) {}

  /* ===============================
     INIT
     =============================== */

  initialize(raceData: RaceApiResponse): void {
    this.raceData = raceData;

    this.clock.raceTime$.subscribe((raceTime) => {
      const lapEnded = this.recomputeTiming(raceTime);

      if (!this.displayOrdered.length && this.timingOrdered.length) {
        this.resetDisplayOrder();
      }

      if (lapEnded) {
        this.resetDisplayOrder();
        this.recomputeIntervals();
        this.provisionalSwapLatch.clear();
      } else {
        this.applyProvisionalOvertakes(raceTime);
      }

      this.emit();
    });
  }

  /* ===============================
     CORE TIMING (CORRECTED)
     =============================== */

  private recomputeTiming(raceTime: number): boolean {
    const source = Object.keys(this.raceData.drivers).map((driver) => ({
      driver,
    })) as LiveDriverState[];

    const next: LiveDriverState[] = [];

    for (const base of source) {
      const driver = base.driver;
      const data = this.raceData.drivers[driver];
      const laps = data.timing.laps;

      const completedLaps = this.getCompletedLapCount(laps, raceTime);
      const currentLap = Math.max(1, completedLaps + 1);
      const lastLap = completedLaps > 0 ? laps[completedLaps - 1] : undefined;

      const position =
        lastLap?.positionAtLapEnd ?? this.lastKnownPosition.get(driver) ?? null;

      if (position != null) {
        this.lastKnownPosition.set(driver, position);
      }

      next.push({
        driver,
        driverNumber: data.driverNumber,
        team: data.team,

        currentLap,
        completedLaps,

        timingPosition: position,
        gapToLeader: null,
        intervalGap: null,
        lapsDown: 0,

        displayPosition: undefined,
        provisionalStatus: null,

        lapDistance: 0,
        raceDistance: 0,
        x: 0,
        y: 0,

        isLeader: false,
        isFinished: completedLaps === this.raceData.session.totalLaps,
        isInPit: this.isInPit(data, raceTime),
      });
    }

    /* ---------- 1️⃣ PRELIM SORT (find leader) ---------- */
    const prelim = [...next].sort((a, b) => {
      if (a.timingPosition != null && b.timingPosition != null) {
        return a.timingPosition - b.timingPosition;
      }
      return a.driver.localeCompare(b.driver);
    });

    if (!prelim.length) return false;

    prelim[0].isLeader = true;

    /* ---------- 2️⃣ LAP END DETECTION (LEADER ONLY) ---------- */
    const leaderCompleted = prelim[0].completedLaps;
    const lapEnded = leaderCompleted !== this.lastLeaderCompletedLaps;

    if (lapEnded && leaderCompleted > 0) {
      this.lastLeaderCompletedLaps = leaderCompleted;
      this.computeLapEndGaps(prelim);
    }

    /* ---------- 3️⃣ FINAL AUTHORITATIVE SORT ---------- */
    const ordered = [...prelim].sort((a, b) => {
      if (a.timingPosition != null && b.timingPosition != null) {
        return a.timingPosition - b.timingPosition;
      }
      if (a.gapToLeader != null && b.gapToLeader != null) {
        return a.gapToLeader - b.gapToLeader;
      }
      return a.driver.localeCompare(b.driver);
    });

    if (lapEnded && leaderCompleted > 0) {
      this.timingOrdered = ordered;
    }

    return lapEnded;
  }

  /* ===============================
     LAP-END GAP LOGIC
     =============================== */

  private computeLapEndGaps(ordered: LiveDriverState[]): void {
    const leader = ordered[0];
    leader.gapToLeader = 0;

    const lapIndex = leader.completedLaps - 1;
    const leaderLap = this.getLapByIndex(leader.driver, lapIndex);
    if (!leaderLap) return;

    const leaderTime = leaderLap.lapStartTime + leaderLap.lapTime;

    for (let i = 1; i < ordered.length; i++) {
      const curr = ordered[i];
      const lap = this.getLapByIndex(curr.driver, lapIndex);

      if (!lap) {
        curr.gapToLeader = null;
        continue;
      }

      curr.gapToLeader = lap.lapStartTime + lap.lapTime - leaderTime;
    }
  }

  /* ===============================
     INTERVALS
     =============================== */

  private recomputeIntervals(): void {
    if (!this.displayOrdered.length) return;

    this.displayOrdered[0].intervalGap = null;

    for (let i = 1; i < this.displayOrdered.length; i++) {
      const curr = this.displayOrdered[i];
      const prev = this.displayOrdered[i - 1];

      if (curr.gapToLeader != null && prev.gapToLeader != null) {
        curr.intervalGap = curr.gapToLeader - prev.gapToLeader;
      } else {
        curr.intervalGap = null;
      }
    }
  }

  /* ===============================
     PROVISIONAL OVERTAKES (UNCHANGED)
     =============================== */

  private applyProvisionalOvertakes(raceTime: number): void {
    for (let i = 1; i < this.displayOrdered.length; i++) {
      const prev = this.displayOrdered[i - 1];
      const curr = this.displayOrdered[i];

      if (prev.currentLap !== curr.currentLap) continue;

      const delta = this.computeSectorInterval(prev, curr, raceTime);
      if (delta !== null && delta < 0) {
        const key = `${curr.currentLap}:${prev.driver}->${curr.driver}`;
        if (this.provisionalSwapLatch.has(key)) continue;

        this.provisionalSwapLatch.add(key);
        this.swapDisplay(i - 1, i);
        break;
      }
    }
  }

  private swapDisplay(a: number, b: number): void {
    const up = this.displayOrdered[b];
    const down = this.displayOrdered[a];

    up.provisionalStatus = 'UP';
    down.provisionalStatus = 'DOWN';

    this.displayOrdered[a] = up;
    this.displayOrdered[b] = down;

    this.recomputeIntervals();
  }

  private computeSectorInterval(
    prev: LiveDriverState,
    curr: LiveDriverState,
    raceTime: number,
  ): number | null {
    const pa = this.sectorAnchors.getLastAnchor(prev.driver, raceTime);
    const ca = this.sectorAnchors.getLastAnchor(curr.driver, raceTime);

    if (!pa || !ca) return null;
    if (pa.lap !== ca.lap || pa.sector !== ca.sector) return null;

    return ca.raceTime - pa.raceTime;
  }

  /* ===============================
     HELPERS
     =============================== */

  private getCompletedLapCount(laps: TimingLapApi[], raceTime: number): number {
    let count = 0;
    for (const lap of laps) {
      if (lap.lapStartTime + lap.lapTime <= raceTime) count++;
    }
    return count;
  }

  private getLapByIndex(
    driver: string,
    index: number,
  ): TimingLapApi | undefined {
    return this.raceData.drivers[driver].timing.laps[index];
  }

  private resetDisplayOrder(): void {
    this.displayOrdered = this.timingOrdered.map((s) => ({
      ...s,
      provisionalStatus: null,
    }));
  }

  private emit(): void {
    this.displayOrdered.forEach((s, i) => (s.displayPosition = i + 1));
    console.log(
      '[ORDER]',
      this.displayOrdered.map((d) => `${d.displayPosition}:${d.driver}`),
    );
    this.stateSubject.next([...this.displayOrdered]);
  }

  private isInPit(data: DriverApiData, raceTime: number): boolean {
    return data.timing.pitStops.some(
      (p) =>
        p.pitInTime != null &&
        p.pitOutTime != null &&
        raceTime > p.pitInTime &&
        raceTime < p.pitOutTime,
    );
  }
}
