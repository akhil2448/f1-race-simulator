import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { RaceApiResponse, TimingLapApi } from '../models/race-data.model';

import { RaceClockService } from './race-clock-service';

export interface FastestLapData {
  driver: string;

  team: string;

  lapTime: string;
}

@Injectable({
  providedIn: 'root',
})
export class FastestLapService {
  private raceData!: RaceApiResponse;

  /**
   * Current fastest lap holder
   */
  private fastestDriverSubject = new BehaviorSubject<string | null>(null);

  fastestDriver$ = this.fastestDriverSubject.asObservable();

  private fastestLapDataSubject = new BehaviorSubject<FastestLapData | null>(
    null,
  );

  fastestLapData$ = this.fastestLapDataSubject.asObservable();

  private currentFastestDriver: string | null = null;

  private currentFastestLapTime = Infinity;

  private currentFastestLapDisplay: string | null = null;

  constructor(private raceClock: RaceClockService) {
    this.raceClock.raceTime$.subscribe((second) => {
      this.update(second);
    });
  }

  initialize(raceData: RaceApiResponse): void {
    this.raceData = raceData;

    this.currentFastestDriver = null;

    this.currentFastestLapTime = Infinity;

    this.fastestDriverSubject.next(null);
    this.fastestLapDataSubject.next(null);
  }

  private update(currentRaceTime: number): void {
    if (!this.raceData) return;

    let bestDriver: string | null = this.currentFastestDriver;

    let bestLapTime = this.currentFastestLapTime;

    Object.entries(this.raceData.drivers).forEach(([driver, data]) => {
      const personalBestLaps = data.personalBestLaps ?? [];

      personalBestLaps.forEach((lapNumber) => {
        const lap = data.timing.laps.find((l) => l.lap === lapNumber);

        if (!lap) return;

        if (!this.isCompletedLap(lap, currentRaceTime)) {
          return;
        }

        if (lap.lapTime < bestLapTime) {
          bestLapTime = lap.lapTime;

          this.currentFastestLapDisplay = this.formatLapTime(lap.lapTime);

          bestDriver = driver;
        }
      });
    });

    if (bestDriver !== this.currentFastestDriver) {
      this.currentFastestDriver = bestDriver;

      this.currentFastestLapTime = bestLapTime;
      // console.log('[FASTEST LAP]', bestDriver, bestLapTime);

      if (bestDriver) {
        const driverData = this.raceData.drivers[bestDriver];

        this.fastestLapDataSubject.next({
          driver: bestDriver,

          team: driverData.team,

          lapTime: this.currentFastestLapDisplay!,
        });
      }

      this.fastestDriverSubject.next(bestDriver);
    }
  }

  private isCompletedLap(lap: TimingLapApi, currentRaceTime: number): boolean {
    return lap.lapStartTime + lap.lapTime <= currentRaceTime;
  }

  isFastestLapHolder(driver: string): boolean {
    return this.currentFastestDriver === driver;
  }

  getCurrentFastestLapFormatted(): string | null {
    return this.currentFastestLapDisplay;
  }

  private formatLapTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);

    const remaining = seconds % 60;

    return `${minutes}:` + remaining.toFixed(3).padStart(6, '0');
  }
}
