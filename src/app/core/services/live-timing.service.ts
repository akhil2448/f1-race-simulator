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

  // 🔒 sector ownership
  private lastSectorByDriver = new Map<string, 1 | 2 | 3>();
  private lastLapByDriver = new Map<string, number>();

  private lastInPitState = new Map<string, boolean>();

  constructor(private clock: RaceClockService) {}

  initialize(raceData: RaceApiResponse, trackLength: number): void {
    this.raceData = raceData;
    this.trackLength = trackLength;

    this.clock.raceTime$.subscribe((raceTime) => {
      this.recomputeState(raceTime);
    });
  }

  private recomputeState(raceTime: number): void {
    const drivers: LiveDriverState[] = [];

    let anyJustExitedPit = false;

    const prevSectorMap = new Map(this.lastSectorByDriver);
    const prevLapMap = new Map(this.lastLapByDriver);

    for (const [driver, data] of Object.entries(this.raceData.drivers)) {
      const laps = data.timing.laps;

      const completedLaps = this.getCompletedLapCount(laps, raceTime);
      const currentLap = completedLaps + 1;

      const lapRef: TimingLapApi | null =
        laps[completedLaps] ?? laps[completedLaps - 1] ?? null;

      const lapStartTime = lapRef?.lapStartTime ?? 0;
      const lapTimeSoFar = Math.max(0, raceTime - lapStartTime);

      /* ---------- LAP DISTANCE ---------- */
      let lapDistance = 0;
      if (lapRef && lapRef.lapTime > 0) {
        const capped = Math.min(lapTimeSoFar, lapRef.lapTime);
        lapDistance = (capped / lapRef.lapTime) * this.trackLength;
      }

      const raceDistance = completedLaps * this.trackLength + lapDistance;

      /* ---------- SECTOR ---------- */
      const currentSector = this.computeSector(lapTimeSoFar, lapRef);

      this.lastSectorByDriver.set(driver, currentSector);
      this.lastLapByDriver.set(driver, currentLap);

      /* ---------- TYRES (AUTHORITATIVE) ---------- */
      const compound = this.getCurrentCompound(data, raceTime);
      const tyreLife = this.getCurrentTyreLife(data, completedLaps);

      /* ---------- PIT LANE DETECTION ---------- */
      const wasInPit = this.lastInPitState.get(driver) ?? false;
      const nowInPit = this.isInPit(data, raceTime);

      if (wasInPit && !nowInPit) {
        anyJustExitedPit = true;
      }

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
        isFinished: completedLaps >= this.raceData.session.totalLaps,
        isInPit: nowInPit,
      });
    }

    if (!drivers.length) return;

    /* ===============================
       ORDER BY TRACK POSITION
       =============================== */

    drivers.sort(this.compareByTrackPosition);

    const leader = drivers[0];
    leader.isLeader = true;

    const leaderChanged =
      this.lastLeaderDriver !== null && this.lastLeaderDriver !== leader.driver;

    this.lastLeaderDriver = leader.driver;

    this.applyLapsDown(drivers);

    /* ===============================
       LAP-END FREEZE
       =============================== */

    if (leader.completedLaps !== this.lastLeaderCompletedLaps) {
      this.lastLeaderCompletedLaps = leader.completedLaps;

      if (leader.completedLaps >= 1) {
        this.applyLapEndGaps(drivers, leader.completedLaps);
      }

      drivers.forEach((d, i) => (d.displayPosition = i + 1));
      this.stateSubject.next([...drivers]);
      return;
    }

    /* ===============================
       LEADER-CHANGE FREEZE
       =============================== */

    // 🔓 allow immediate recompute when someone exits pit
    if (leaderChanged && !anyJustExitedPit) {
      drivers.forEach((d, i) => (d.displayPosition = i + 1));
      this.stateSubject.next([...drivers]);
      return;
    }

    // 🔓 Force gap recompute immediately after pit exit
    if (anyJustExitedPit) {
      leader.gapToLeader = 0;
      leader.intervalGap = null;
    }

    /* ===============================
       MID-LAP GAPS
       =============================== */

    leader.gapToLeader = 0;
    leader.intervalGap = null;

    const leaderLap =
      leader.completedLaps > 0
        ? this.getLapByIndex(leader.driver, leader.completedLaps - 1)
        : null;

    const leaderSpeed =
      leaderLap && leaderLap.lapTime > 0
        ? this.trackLength / leaderLap.lapTime
        : null;

    if (!leaderSpeed || leaderSpeed <= 0) {
      drivers.forEach((d, i) => (d.displayPosition = i + 1));
      this.stateSubject.next([...drivers]);
      return;
    }

    for (let i = 1; i < drivers.length; i++) {
      const curr = drivers[i];
      const prev = drivers[i - 1];

      const gapMeters = leader.raceDistance - curr.raceDistance;
      curr.gapToLeader = gapMeters / leaderSpeed;

      curr.intervalGap =
        curr.gapToLeader != null && prev.gapToLeader != null
          ? curr.gapToLeader - prev.gapToLeader
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

  private isInPit(data: DriverApiData, raceTime: number): boolean {
    if (raceTime < 60) return false;

    const pitStops = data.timing.pitStops ?? [];

    let lastPitEvent: 'IN' | 'OUT' | null = null;

    for (const p of pitStops) {
      // pit-lane entry
      if (p.pitInTime != null && raceTime >= p.pitInTime) {
        lastPitEvent = 'IN';
      }

      // pit-lane exit (track rejoin)
      if (p.pitOutTime != null && raceTime >= p.pitOutTime) {
        lastPitEvent = 'OUT';
      }
    }

    // IN PIT only if last event was pit entry
    return lastPitEvent === 'IN';
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

  private applyLapsDown(drivers: LiveDriverState[]): void {
    const leaderLaps = drivers[0].completedLaps;
    for (const d of drivers) {
      d.lapsDown = Math.max(0, leaderLaps - d.completedLaps);
    }
  }

  /* ===============================
     TYRES (AUTHORITATIVE)
     =============================== */

  private getCurrentCompound(data: DriverApiData, raceTime: number): string {
    const pitStops = data.timing.pitStops;
    if (!pitStops || pitStops.length === 0) return 'UNKNOWN';

    // starting compound
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
    if (!laps || laps.length === 0) return null;

    const lapIndex = Math.max(0, completedLaps - 1);
    return laps[lapIndex]?.tyreLife ?? null;
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
    if (!leaderLap) return;

    const leaderTime = leaderLap.lapStartTime + leaderLap.lapTime;

    for (let i = 1; i < ordered.length; i++) {
      const curr = ordered[i];
      const lap = this.getLapByIndex(curr.driver, lapIndex);
      if (!lap) continue;

      curr.gapToLeader = lap.lapStartTime + lap.lapTime - leaderTime;

      const prevGap = ordered[i - 1].gapToLeader;
      curr.intervalGap = prevGap != null ? curr.gapToLeader - prevGap : null;
    }
  }
}
