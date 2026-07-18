import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { ScreenWakeLockService } from './screen-wake-lock.service';

@Injectable({
  providedIn: 'root',
})
export class RaceClockService {
  private currentSecond$ = new BehaviorSubject<number>(0);
  private paused$ = new BehaviorSubject<boolean>(true);

  private playbackMode$ = new BehaviorSubject<'PLAYING' | 'PAUSED' | 'SEEKING'>(
    'PAUSED',
  );

  private speed = 1; // 1x by default
  private timerSub?: Subscription;

  constructor(private screenWakeLockService: ScreenWakeLockService) {}

  /** Observable for components */
  raceTime$ = this.currentSecond$.asObservable();
  isPaused$ = this.paused$.asObservable();
  playbackModeObservable$ = this.playbackMode$.asObservable();

  play() {
    if (this.timerSub) return;

    this.paused$.next(false);
    this.playbackMode$.next('PLAYING');

    this.timerSub = interval(1000 / this.speed).subscribe(() => {
      this.currentSecond$.next(this.currentSecond$.value + 1);
    });

    this.screenWakeLockService.enable();
  }

  pause() {
    this.timerSub?.unsubscribe();
    this.timerSub = undefined;

    this.paused$.next(true);
    this.playbackMode$.next('PAUSED');

    this.screenWakeLockService.disable();
  }

  reset() {
    this.pause();

    this.speed = 1;

    this.currentSecond$.next(0);

    this.playbackMode$.next('PAUSED');
  }

  seekTo(second: number) {
    const safeSecond = Math.max(0, Math.floor(second));

    // Stop timer ONLY
    this.timerSub?.unsubscribe();
    this.timerSub = undefined;

    this.paused$.next(true);

    this.playbackMode$.next('SEEKING');

    this.currentSecond$.next(safeSecond);

    this.playbackMode$.next('PAUSED');

    this.screenWakeLockService.disable();
  }

  setSpeed(multiplier: 0.5 | 1 | 2 | 4) {
    this.speed = multiplier;
    if (this.timerSub) {
      this.pause();
      this.play();
    }
  }

  isPaused(): boolean {
    return this.paused$.value;
  }

  getCurrentSecond(): number {
    return this.currentSecond$.value;
  }
}
