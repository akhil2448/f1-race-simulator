import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type LeaderboardDisplayMode =
  | 'INTERVAL'
  | 'LEADER_GAP'
  | 'TYRE'
  | 'PIT'
  | 'LAPPED'
  | 'GAINED_LOST';

@Injectable({
  providedIn: 'root',
})
export class LeaderboardDisplayService {
  private temporaryModeSubject =
    new BehaviorSubject<LeaderboardDisplayMode | null>(null);

  temporaryMode$ = this.temporaryModeSubject.asObservable();

  private timer?: number;

  showTemporaryMode(mode: 'TYRE' | 'PIT' | 'LAPPED' | 'GAINED_LOST'): void {
    this.temporaryModeSubject.next(mode);

    clearTimeout(this.timer);

    this.timer = window.setTimeout(() => {
      this.temporaryModeSubject.next(null);
    }, 3000);
  }

  clearTemporaryMode(): void {
    clearTimeout(this.timer);

    this.temporaryModeSubject.next(null);
  }
}
