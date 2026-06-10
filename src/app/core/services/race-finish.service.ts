import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { RaceApiResponse } from '../models/race-data.model';
import { RaceClockService } from './race-clock-service';

@Injectable({
  providedIn: 'root',
})
export class RaceFinishService {
  private driverFinishTimes = new Map<string, number>();

  private finishedDriversSubject = new BehaviorSubject<Set<string>>(new Set());

  finishedDrivers$ = this.finishedDriversSubject.asObservable();

  private raceFinishedSubject = new BehaviorSubject<boolean>(false);

  raceFinished$ = this.raceFinishedSubject.asObservable();

  private raceFinalizationTime = 0;

  constructor(private clock: RaceClockService) {
    this.clock.raceTime$.subscribe((second) => {
      this.update(second);
    });
  }

  initialize(raceData: RaceApiResponse): void {
    this.driverFinishTimes.clear();

    let latestFinish = 0;

    Object.entries(raceData.drivers).forEach(([driver, data]) => {
      const laps = data.timing.laps ?? [];

      const finalLap = laps.find(
        (l) => l.lapNumber === raceData.session.totalLaps,
      );

      // driver never finished race distance
      if (!finalLap) {
        return;
      }

      const finishTime = finalLap.lapStartTime + finalLap.lapTime;

      this.driverFinishTimes.set(driver, finishTime);

      latestFinish = Math.max(latestFinish, finishTime);
    });

    this.raceFinalizationTime = latestFinish;

    this.finishedDriversSubject.next(new Set());

    this.raceFinishedSubject.next(false);
  }

  private update(currentSecond: number): void {
    const finished = new Set(this.finishedDriversSubject.value);

    this.driverFinishTimes.forEach((finishTime, driver) => {
      if (currentSecond >= finishTime) {
        finished.add(driver);
      }
    });

    this.finishedDriversSubject.next(finished);

    if (
      !this.raceFinishedSubject.value &&
      currentSecond >= this.raceFinalizationTime
    ) {
      this.raceFinishedSubject.next(true);

      this.clock.pause();
    }
  }

  isDriverFinished(driver: string): boolean {
    return this.finishedDriversSubject.value.has(driver);
  }

  isRaceFinished(): boolean {
    return this.raceFinishedSubject.value;
  }
}
