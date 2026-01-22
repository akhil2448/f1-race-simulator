import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  DriverApiData,
  RaceApiResponse,
  TimingLapApi,
} from '../models/race-data.model';
import { RaceClockService } from './race-clock-service';
import { LiveDriverState } from '../models/live-driver-state.model';

@Injectable({ providedIn: 'root' })
export class LiveTimingService {
  private raceData!: RaceApiResponse;
  private trackLength!: number;

  private stateSubject = new BehaviorSubject<LiveDriverState[]>([]);
  state$ = this.stateSubject.asObservable();

  private lastLeaderCompletedLaps = -1;
  private lastLeaderDriver: string | null = null;

  private lastSectorByDriver = new Map<string, 1 | 2 | 3>();
  private lastLapByDriver = new Map<string, number>();
  private lastInPitState = new Map<string, boolean>();

  // 🔑 broadcast-style timing memory
  private lastValidGapToLeader = new Map<string, number>();

  // 🔒 recovery lock after untimed lap
  private timingRecoveryLock = new Set<string>();

  // 🔒 NEW: interval control (external)
  private intervalsAllowed = true;

  private raceFinished = false;
  private finalState: LiveDriverState[] | null = null;

  constructor(private clock: RaceClockService) {}

  /* =====================================================
     EXTERNAL CONTROL (CALLED BY LEADERBOARD)
     ===================================================== */

  freezeIntervals(): void {
    this.intervalsAllowed = false;
  }

  resumeIntervals(): void {
    this.intervalsAllowed = true;
  }

  /* =====================================================
     INITIALIZATION
     ===================================================== */

  initialize(raceData: RaceApiResponse, trackLength: number): void {
    this.raceData = raceData;
    this.trackLength = trackLength;

    this.clock.raceTime$.subscribe((raceTime) => {
      this.recomputeState(raceTime);
    });
  }

  /* =====================================================
     TIMING VALIDITY
     ===================================================== */

  private isLapTimed(
    lap: TimingLapApi | null | undefined,
  ): lap is TimingLapApi {
    return !!lap && typeof lap.lapTime === 'number' && lap.lapTime > 0;
  }

  /* =====================================================
     CORE UPDATE
     ===================================================== */

  private recomputeState(raceTime: number): void {
    // 🔒 HARD FREEZE AFTER FINISH
    if (this.raceFinished && this.finalState) {
      this.stateSubject.next([...this.finalState]);
      return;
    }

    const drivers: LiveDriverState[] = [];
    let anyJustExitedPit = false;

    const totalLaps = this.raceData.session.totalLaps;

    /* ---------- BUILD DRIVER STATES ---------- */
    for (const [driver, data] of Object.entries(this.raceData.drivers)) {
      const laps = data.timing.laps;

      const completedLaps = this.getCompletedLapCount(laps, raceTime);
      const rawCurrentLap = completedLaps + 1;
      const currentLap = Math.min(rawCurrentLap, totalLaps);

      const candidateLap = laps[completedLaps];
      const prevLap = laps[completedLaps - 1];

      const lapRef = this.isLapTimed(candidateLap)
        ? candidateLap
        : this.isLapTimed(prevLap)
          ? prevLap
          : null;

      const lapStartTime = lapRef?.lapStartTime ?? 0;
      const lapTimeSoFar = Math.max(0, raceTime - lapStartTime);

      let lapDistance = 0;
      if (this.isLapTimed(lapRef)) {
        const capped = Math.min(lapTimeSoFar, lapRef.lapTime);
        lapDistance = (capped / lapRef.lapTime) * this.trackLength;
      }

      const raceDistance = completedLaps * this.trackLength + lapDistance;

      const currentSector = this.computeSector(lapTimeSoFar, lapRef);
      this.lastSectorByDriver.set(driver, currentSector);
      this.lastLapByDriver.set(driver, currentLap);

      const compound = this.getCurrentCompound(data, raceTime);
      const tyreLife = this.getCurrentTyreLife(data, completedLaps);

      const wasInPit = this.lastInPitState.get(driver) ?? false;
      const nowInPit = this.isInPit(data, raceTime);
      if (wasInPit && !nowInPit) anyJustExitedPit = true;
      this.lastInPitState.set(driver, nowInPit);

      drivers.push({
        driver,
        driverNumber: data.driverNumber,
        team: data.team,

        currentLap,
        completedLaps,
        currentSector,

        timingPosition: null,
        displayPosition: undefined,

        lapDistance,
        raceDistance,

        gapToLeader: null,
        intervalGap: null,
        lapsDown: 0,

        compound,
        tyreLife,

        provisionalStatus: null,

        x: 0,
        y: 0,

        isLeader: false,
        isFinished: completedLaps >= totalLaps,
        isInPit: nowInPit,
      });
    }

    if (!drivers.length) return;

    drivers.sort(this.compareByTrackPosition);

    const leader = drivers[0];
    leader.isLeader = true;

    /* =====================================================
       FINAL CLASSIFICATION
       ===================================================== */

    if (!this.raceFinished && leader.completedLaps >= totalLaps) {
      this.raceFinished = true;

      this.applyLapEndGaps(drivers, totalLaps);

      this.finalState = drivers.map((d) => ({ ...d }));
      this.stateSubject.next([...this.finalState]);
      return;
    }

    /* =====================================================
       LAP END
       ===================================================== */

    this.applyLapsDown(drivers);

    if (leader.completedLaps !== this.lastLeaderCompletedLaps) {
      this.lastLeaderCompletedLaps = leader.completedLaps;

      if (leader.completedLaps >= 1) {
        this.applyLapEndGaps(drivers, leader.completedLaps);
      }

      drivers.forEach((d, i) => (d.displayPosition = i + 1));
      this.stateSubject.next([...drivers]);
      return;
    }

    /* =====================================================
       INTERVAL FREEZE (YELLOW / SC / RESTART)
       ===================================================== */

    if (!this.intervalsAllowed) {
      this.applyLapEndGaps(drivers, leader.completedLaps);
      drivers.forEach((d, i) => (d.displayPosition = i + 1));
      this.stateSubject.next([...drivers]);
      return;
    }

    /* =====================================================
       MID-LAP GAPS
       ===================================================== */

    const leaderLap =
      leader.completedLaps > 0
        ? this.getLapByIndex(leader.driver, leader.completedLaps - 1)
        : null;

    if (!this.isLapTimed(leaderLap)) return;

    leader.gapToLeader = 0;
    leader.intervalGap = null;
    this.lastValidGapToLeader.set(leader.driver, 0);

    const leaderSpeed = this.trackLength / leaderLap.lapTime;

    for (let i = 1; i < drivers.length; i++) {
      const curr = drivers[i];

      const currLap =
        curr.completedLaps > 0
          ? this.getLapByIndex(curr.driver, curr.completedLaps - 1)
          : null;

      if (!this.isLapTimed(currLap)) {
        this.timingRecoveryLock.add(curr.driver);
        curr.gapToLeader = this.lastValidGapToLeader.get(curr.driver) ?? null;
      } else if (this.timingRecoveryLock.has(curr.driver)) {
        curr.gapToLeader = this.lastValidGapToLeader.get(curr.driver) ?? null;
      } else {
        const gapMeters = leader.raceDistance - curr.raceDistance;
        const gap = gapMeters / leaderSpeed;
        curr.gapToLeader = gap;
        this.lastValidGapToLeader.set(curr.driver, gap);
      }

      let anchor: LiveDriverState | undefined;
      for (let j = i - 1; j >= 0; j--) {
        if (drivers[j].gapToLeader !== null) {
          anchor = drivers[j];
          break;
        }
      }

      curr.intervalGap =
        anchor && curr.gapToLeader !== null
          ? curr.gapToLeader - anchor.gapToLeader!
          : null;
    }

    drivers.forEach((d, i) => (d.displayPosition = i + 1));
    this.stateSubject.next([...drivers]);
  }

  /* ===============================
     HELPERS
     =============================== */

  private getCompletedLapCount(laps: TimingLapApi[], raceTime: number): number {
    let count = 0;
    for (const lap of laps) {
      if (this.isLapTimed(lap) && lap.lapStartTime + lap.lapTime <= raceTime) {
        count++;
      }
    }
    return count;
  }

  private getLapByIndex(
    driver: string,
    index: number,
  ): TimingLapApi | undefined {
    return this.raceData.drivers[driver].timing.laps[index];
  }

  private isInPit(data: DriverApiData, raceTime: number): boolean {
    if (raceTime < 60) return false;
    const pitStops = data.timing.pitStops ?? [];
    let lastEvent: 'IN' | 'OUT' | null = null;

    for (const p of pitStops) {
      if (p.pitInTime != null && raceTime >= p.pitInTime) lastEvent = 'IN';
      if (p.pitOutTime != null && raceTime >= p.pitOutTime) lastEvent = 'OUT';
    }
    return lastEvent === 'IN';
  }

  private computeSector(
    lapTimeSoFar: number,
    lap: TimingLapApi | null,
  ): 1 | 2 | 3 {
    if (!lap || !lap.sectorTimes?.length) return 1;
    const s1 = lap.sectorTimes[0] ?? 0;
    const s2 = lap.sectorTimes[1] ?? 0;
    if (lapTimeSoFar < s1) return 1;
    if (lapTimeSoFar < s1 + s2) return 2;
    return 3;
  }

  private getCurrentCompound(data: DriverApiData, raceTime: number): string {
    const pitStops = data.timing.pitStops;
    if (!pitStops?.length) return 'UNKNOWN';

    let compound = pitStops[0].compound ?? 'UNKNOWN';
    for (const p of pitStops) {
      if (p.pitOutTime != null && raceTime >= p.pitOutTime) {
        compound = p.compound ?? compound;
      }
    }
    return compound;
  }

  private getCurrentTyreLife(
    data: DriverApiData,
    completedLaps: number,
  ): number | null {
    const laps = data.timing.laps;
    if (!laps?.length) return null;
    return laps[Math.max(0, completedLaps - 1)]?.tyreLife ?? null;
  }

  private compareByTrackPosition(
    a: LiveDriverState,
    b: LiveDriverState,
  ): number {
    if (a.completedLaps !== b.completedLaps) {
      return b.completedLaps - a.completedLaps;
    }
    if (a.lapDistance !== b.lapDistance) {
      return b.lapDistance - a.lapDistance;
    }
    return b.raceDistance - a.raceDistance;
  }

  private applyLapEndGaps(
    ordered: LiveDriverState[],
    completedLaps: number,
  ): void {
    const leader = ordered[0];
    leader.gapToLeader = 0;
    leader.intervalGap = null;

    const lapIndex = completedLaps - 1;
    const leaderLap = this.getLapByIndex(leader.driver, lapIndex);
    if (!leaderLap || !this.isLapTimed(leaderLap)) return;

    const leaderTime = leaderLap.lapStartTime + leaderLap.lapTime;

    for (let i = 1; i < ordered.length; i++) {
      const lap = this.getLapByIndex(ordered[i].driver, lapIndex);
      if (!lap || !this.isLapTimed(lap)) continue;

      const currGap = lap.lapStartTime + lap.lapTime - leaderTime;
      ordered[i].gapToLeader = currGap;

      const prevGap = ordered[i - 1].gapToLeader;
      ordered[i].intervalGap = prevGap != null ? currGap - prevGap : null;

      this.timingRecoveryLock.delete(ordered[i].driver);
      this.lastValidGapToLeader.set(ordered[i].driver, currGap);
    }
  }

  private applyLapsDown(drivers: LiveDriverState[]): void {
    const leaderCompletedLaps = drivers[0].completedLaps;
    drivers.forEach((d) => {
      d.lapsDown = Math.max(0, leaderCompletedLaps - d.completedLaps);
    });
  }
}
