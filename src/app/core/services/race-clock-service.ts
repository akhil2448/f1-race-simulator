import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RaceClockService {
  private currentSecond$ = new BehaviorSubject<number>(0);
  private speed = 1; // 1x by default
  private timerSub?: Subscription;

  /** Observable for components */
  raceTime$ = this.currentSecond$.asObservable();

  play() {
    if (this.timerSub) return;

    this.timerSub = interval(1000 / this.speed).subscribe(() => {
      this.currentSecond$.next(this.currentSecond$.value + 1);
      console.log(this.currentSecond$.value);
    });
  }

  pause() {
    this.timerSub?.unsubscribe();
    this.timerSub = undefined;
  }

  reset() {
    this.pause();
    this.currentSecond$.next(0);
  }

  setSpeed(multiplier: 0.5 | 1 | 2 | 4) {
    this.speed = multiplier;
    if (this.timerSub) {
      this.pause();
      this.play();
    }
  }

  getCurrentSecond(): number {
    return this.currentSecond$.value;
  }
}
