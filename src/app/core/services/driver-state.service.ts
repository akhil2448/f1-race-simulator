import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RaceClockService } from './race-clock-service';
import {
  DriverInternalState,
  DriverRaceState,
  PitWindow,
} from '../models/driver-state.model';

/* ============================
   Service
   ============================ */

@Injectable({
  providedIn: 'root',
})
export class DriverStateService {
  /** Internal cache per driver */
  private driverStateMap = new Map<string, DriverInternalState>();

  /** Public reactive driver state */
  private driverRaceState$ = new BehaviorSubject<Map<string, DriverRaceState>>(
    new Map()
  );

  constructor(private raceClock: RaceClockService) {}

  /* =====================================================
     Initialization (call ONCE before race starts)
     ===================================================== */

  initialize(raceData: any): void {
    this.driverStateMap.clear();

    Object.entries(raceData.drivers).forEach(
      ([driverCode, driverData]: [string, any]) => {
        const pitWindows = this.buildPitWindows(driverData.PitStopData);

        const startingCompound =
          driverData.PitStopData?.[0]?.Compound ?? 'UNKNOWN';

        this.driverStateMap.set(driverCode, {
          startingCompound,
          pitWindows,
        });
      }
    );

    this.bindRaceClock();
  }

  /* =====================================================
     Public observable
     ===================================================== */

  get driverState$(): Observable<Map<string, DriverRaceState>> {
    return this.driverRaceState$.asObservable();
  }

  /* =====================================================
     RaceClock binding
     ===================================================== */

  private bindRaceClock(): void {
    this.raceClock.raceTime$.subscribe((raceTime) => {
      const state = new Map<string, DriverRaceState>();

      this.driverStateMap.forEach((driver, code) => {
        const activePit = driver.pitWindows.find(
          (w) => raceTime >= w.in && raceTime < w.out
        );

        state.set(code, {
          isInPit: !!activePit,
          currentCompound: this.resolveCompound(driver, raceTime),
        });
      });

      this.driverRaceState$.next(state);
    });
  }

  /* =====================================================
     Pit window construction
     ===================================================== */

  private buildPitWindows(pitData: any[]): PitWindow[] {
    if (!pitData?.length) return [];

    const windows: PitWindow[] = [];
    let openPitIn: number | null = null;

    for (const entry of pitData) {
      // PIT IN (normal pit stop)
      if (entry.PitInTime != null) {
        openPitIn = entry.PitInTime;
      }

      // PIT OUT
      if (entry.PitOutTime != null) {
        const pitOut = entry.PitOutTime;

        // Race start from Pit-lane (no PitInTime before)
        if (openPitIn === null) {
          windows.push({
            in: 0,
            out: pitOut,
            compoundAfter: entry.Compound,
          });
        } else {
          windows.push({
            in: openPitIn,
            out: pitOut,
            compoundAfter: entry.Compound,
          });
        }

        openPitIn = null;
      }
    }

    // Open pit till end (DNF case)
    if (openPitIn !== null) {
      windows.push({
        in: openPitIn,
        out: Number.POSITIVE_INFINITY,
        compoundAfter: 'UNKNOWN',
      });
    }

    return windows;
  }

  /* =====================================================
     Compound resolution
     ===================================================== */

  private resolveCompound(
    driver: DriverInternalState,
    raceTime: number
  ): string {
    let compound = driver.startingCompound;

    for (const pit of driver.pitWindows) {
      if (pit.isPitLaneStart) {
        continue; // ❗ no compound change
      }

      if (raceTime >= pit.out && pit.compoundAfter) {
        compound = pit.compoundAfter;
      }
    }
    return compound;
  }
}
