import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RaceClockService } from '../../../core/services/race-clock-service';

@Component({
  selector: 'app-race-clock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-clock.component.html',
  styleUrl: './race-clock.component.scss',
})
export class RaceClockComponent implements OnInit, OnDestroy {
  currentSecond = 0;
  private sub?: Subscription;

  speed: 0.5 | 1 | 2 | 4 = 1;

  paused!: boolean;

  constructor(private raceClock: RaceClockService) {}

  ngOnInit(): void {
    this.sub = this.raceClock.raceTime$.subscribe((sec) => {
      this.currentSecond = sec;
    });

    this.raceClock.isPaused$.subscribe((p) => {
      this.paused = p;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  play() {
    this.raceClock.play();
  }

  pause() {
    this.raceClock.pause();
  }

  reset() {
    this.raceClock.reset();
  }

  setSpeed(multiplier: 0.5 | 1 | 2 | 4) {
    this.speed = multiplier; // 👈 UI state
    this.raceClock.setSpeed(multiplier); // 👈 engine state
  }

  /** mm:ss formatting */
  get formattedTime(): string {
    const minutes = Math.floor(this.currentSecond / 60);
    const seconds = this.currentSecond % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
