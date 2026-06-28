import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { PlaybackFrame } from '../models/playback-frame.model';

@Injectable({
  providedIn: 'root',
})
export class LapPlaybackService {
  /**
   * Complete telemetry for the lap.
   */
  private telemetry: any[] = [];

  /**
   * Current lap progress (0 -> 1).
   * This is the single source of truth.
   */
  private currentProgressSubject = new BehaviorSubject<number>(0);

  readonly currentProgress$: Observable<number> =
    this.currentProgressSubject.asObservable();

  /**
   * Current playback frame.
   */
  private currentFrameSubject = new BehaviorSubject<PlaybackFrame | null>(null);

  readonly currentFrame$: Observable<PlaybackFrame | null> =
    this.currentFrameSubject.asObservable();

  /**
   * Playback state.
   */
  private playingSubject = new BehaviorSubject<boolean>(false);

  readonly playing$ = this.playingSubject.asObservable();

  /**
   * requestAnimationFrame id.
   */
  private animationFrameId: number | null = null;

  /**
   * Progress added every animation frame.
   */
  private playbackSpeed = 0.0025;

  /**
   * Load telemetry.
   */
  loadLap(telemetry: any[]): void {
    this.pause();

    this.telemetry = telemetry ?? [];

    console.log('Loaded telemetry samples:', this.telemetry.length);

    if (this.telemetry.length === 0) {
      this.currentProgressSubject.next(0);
      this.currentFrameSubject.next(null);
      return;
    }

    this.currentProgressSubject.next(0);
    this.publishFrame();
  }

  /**
   * Play.
   */
  play(): void {
    if (this.playingSubject.value || this.telemetry.length === 0) {
      return;
    }

    this.playingSubject.next(true);

    const animate = () => {
      if (!this.playingSubject.value) {
        return;
      }

      const nextProgress =
        this.currentProgressSubject.value + this.playbackSpeed;

      if (nextProgress >= 1) {
        this.seekProgress(1);
        this.pause();
        return;
      }

      this.seekProgress(nextProgress);

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Pause.
   */
  pause(): void {
    this.playingSubject.next(false);

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Toggle play/pause.
   */
  toggle(): void {
    this.playingSubject.value ? this.pause() : this.play();
  }

  /**
   * Step forward.
   */
  stepForward(): void {
    this.pause();
    this.seekProgress(Math.min(this.currentProgressSubject.value + 0.01, 1));
  }

  /**
   * Step backward.
   */
  stepBackward(): void {
    this.pause();
    this.seekProgress(Math.max(this.currentProgressSubject.value - 0.01, 0));
  }

  /**
   * Slider seek.
   */
  seek(progress: number): void {
    this.seekProgress(progress);
  }

  /**
   * Seek using normalized lap progress.
   */
  seekProgress(progress: number): void {
    if (this.telemetry.length === 0) {
      return;
    }

    progress = Math.max(0, Math.min(progress, 1));

    this.currentProgressSubject.next(progress);

    this.publishFrame();
  }

  /**
   * Returns the index of the first telemetry sample
   * whose rd >= progress.
   *
   * Binary search.
   */
  private findNextSampleIndex(progress: number): number {
    let low = 0;
    let high = this.telemetry.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);

      const rd = Number(this.telemetry[mid].rd);

      if (rd < progress) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return Math.min(low, this.telemetry.length - 1);
  }

  /**
   * Creates one interpolated playback frame.
   */
  private publishFrame(): void {
    if (this.telemetry.length === 0) {
      return;
    }

    const progress = this.currentProgressSubject.value;

    const nextIndex = this.findNextSampleIndex(progress);

    if (nextIndex <= 0) {
      const sample = this.telemetry[0];

      this.currentFrameSubject.next({
        progress,
        previous: sample,
        next: sample,
        factor: 0,
        sample,
      });

      return;
    }

    const previous = this.telemetry[nextIndex - 1];
    const next = this.telemetry[nextIndex];

    const previousRd = Number(previous.rd);
    const nextRd = Number(next.rd);

    const factor =
      nextRd === previousRd
        ? 0
        : (progress - previousRd) / (nextRd - previousRd);

    this.currentFrameSubject.next({
      progress,
      previous,
      next,
      factor,
      sample: {
        rd: progress,

        d: previous.d + (next.d - previous.d) * factor,

        x: previous.x + (next.x - previous.x) * factor,

        y: previous.y + (next.y - previous.y) * factor,

        speed: previous.speed + (next.speed - previous.speed) * factor,

        rpm: previous.rpm + (next.rpm - previous.rpm) * factor,

        throttle:
          previous.throttle + (next.throttle - previous.throttle) * factor,

        brake: previous.brake + (next.brake - previous.brake) * factor,

        gear: factor < 0.5 ? previous.gear : next.gear,
      },
    });
  }

  /**
   * Current progress.
   */
  get progress(): number {
    return this.currentProgressSubject.value;
  }

  /**
   * Sample count.
   */
  get sampleCount(): number {
    return this.telemetry.length;
  }

  /**
   * Current progress.
   */
  get currentProgress(): number {
    return this.currentProgressSubject.value;
  }

  /**
   * Current playback frame.
   */
  get currentFrame(): PlaybackFrame | null {
    return this.currentFrameSubject.value;
  }
}
