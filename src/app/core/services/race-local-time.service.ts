import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RaceClockService } from './race-clock-service';

@Injectable({ providedIn: 'root' })
export class RaceLocalTimeService {
  private raceStartMs: number | null = null;

  private localTimeSubject = new BehaviorSubject<Date | null>(null);
  readonly time$ = this.localTimeSubject.asObservable();

  constructor(private raceClock: RaceClockService) {
    this.raceClock.raceTime$.subscribe((sec) => {
      if (this.raceStartMs === null) return;

      const t = new Date(this.raceStartMs + sec * 1000);
      this.localTimeSubject.next(t);
    });
  }

  /** Call ONCE after race data load */
  initialize(localTimeAtRaceStart: string): void {
    /**
     * "15:03:38.698"
     */
    const [hms, ms = '0'] = localTimeAtRaceStart.split('.');
    const [h, m, s] = hms.split(':').map(Number);

    const base = new Date();
    base.setHours(h, m, s, Number(ms));

    this.raceStartMs = base.getTime();
    this.localTimeSubject.next(base);
  }
}
