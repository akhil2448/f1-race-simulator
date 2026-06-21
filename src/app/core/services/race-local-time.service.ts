import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RaceClockService } from './race-clock-service';

@Injectable({ providedIn: 'root' })
export class RaceLocalTimeService {
  private raceStartSeconds: number | null = null;

  private localTimeSubject = new BehaviorSubject<Date | null>(null);
  readonly time$ = this.localTimeSubject.asObservable();

  constructor(private raceClock: RaceClockService) {
    this.raceClock.raceTime$.subscribe((sec) => {
      if (this.raceStartSeconds === null) {
        return;
      }

      const clockSeconds = this.raceStartSeconds + sec;

      this.localTimeSubject.next(this.buildClockDate(clockSeconds));
    });
  }

  /** Call ONCE after race data load */
  initialize(localTimeAtRaceStart: string): void {
    const [hms] = localTimeAtRaceStart.split('.');

    const [h, m, s] = hms.split(':').map(Number);

    this.raceStartSeconds = h * 3600 + m * 60 + s;

    this.localTimeSubject.next(this.buildClockDate(this.raceStartSeconds));
  }

  getLocalTimeForRaceSecond(raceSecond: number): Date | null {
    if (this.raceStartSeconds === null) {
      return null;
    }

    return this.buildClockDate(this.raceStartSeconds + raceSecond);
  }

  formatRaceSecond(raceSecond: number): string {
    const date = this.getLocalTimeForRaceSecond(raceSecond);

    if (!date) {
      return '--:--:--';
    }

    return [
      String(date.getUTCHours()).padStart(2, '0'),
      String(date.getUTCMinutes()).padStart(2, '0'),
      String(date.getUTCSeconds()).padStart(2, '0'),
    ].join(':');
  }

  private buildClockDate(totalSeconds: number): Date {
    const normalized = ((totalSeconds % 86400) + 86400) % 86400;

    const hours = Math.floor(normalized / 3600);
    const minutes = Math.floor((normalized % 3600) / 60);
    const seconds = normalized % 60;

    const d = new Date(0);

    d.setUTCHours(hours, minutes, seconds, 0);

    return d;
  }

  reset(): void {
    this.raceStartSeconds = null;

    this.localTimeSubject.next(null);
  }
}
