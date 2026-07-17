import {
  Component,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
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

  @Output()
  stopRequested = new EventEmitter<void>();

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
    window.dispatchEvent(new CustomEvent('replay-resumed'));
    this.raceClock.play();
  }

  pause() {
    this.raceClock.pause();
  }

  reset() {
    this.stopRequested.emit();
  }

  setSpeed(multiplier: 0.5 | 1 | 2 | 4) {
    this.speed = multiplier; // 👈 UI state
    this.raceClock.setSpeed(multiplier); // 👈 engine state
  }

  /** HH:mm:ss formatting */
  get formattedTime(): string {
    const h = Math.floor(this.currentSecond / 3600);
    const m = Math.floor((this.currentSecond % 3600) / 60);
    const s = this.currentSecond % 60;

    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  }

  get timeWidthClass(): string {
    if (this.currentSecond >= 3600) {
      return 'hours';
    }

    if (this.currentSecond >= 600) {
      return 'minutes-2';
    }

    return 'minutes-1';
  }
}
