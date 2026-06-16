import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { RaceClockService } from './race-clock-service';
import { TimingEventProcessorService } from './timing-event-processor.service';
import { TelemetryInterpolationService } from './telemetry-interpolation.service';
import { DriverPresenceService } from './driver-presence.service';
import { LoadingOverlayService } from './loading-overlay.service';

@Injectable({
  providedIn: 'root',
})
export class SeekCoordinatorService {
  private seekingSubject = new BehaviorSubject<boolean>(false);

  /**
   * TRUE only during replay seek lifecycle.
   *
   * Used by:
   * - race control suppression
   * - green event suppression
   * - future replay side-effect suppression
   */
  isSeeking$ = this.seekingSubject.asObservable();

  isSeekingSnapshot(): boolean {
    return this.seekingSubject.value;
  }

  constructor(
    private clock: RaceClockService,
    private timingProcessor: TimingEventProcessorService,
    private telemetryInterpolation: TelemetryInterpolationService,
    private driverPresence: DriverPresenceService,
    private overlay: LoadingOverlayService,
  ) {}

  /**
   * Centralized replay seek orchestration.
   *
   * ALL discontinuous timeline jumps
   * must go through this service.
   */
  async seekToRaceSecond(targetSecond: number): Promise<void> {
    console.log('[SeekCoordinator] Starting seek:', targetSecond);

    /* =========================================
   1. ENTER SEEK MODE
   ========================================= */

    this.seekingSubject.next(true);

    /* =========================================
   2. SHOW LOADING OVERLAY
   ========================================= */

    this.overlay.show();

    /* =========================================
   3. PAUSE PLAYBACK
   ========================================= */

    this.clock.pause();

    /* =========================================
   4. RESET STATEFUL REPLAY SERVICES
   ========================================= */

    this.timingProcessor.reset();

    this.telemetryInterpolation.resetAfterSeek();

    this.driverPresence.resetAfterSeek();

    /**
     * Allow overlay to visually render
     */
    await this.delay(400);

    /* =========================================
   5. SEEK CLOCK
   ========================================= */

    this.clock.seekTo(targetSecond);

    /**
     * Keep cinematic loading visible
     */
    await this.delay(2000);

    /* =========================================
   6. HIDE LOADING OVERLAY
   ========================================= */

    this.overlay.hide();

    /* =========================================
   7. EXIT SEEK MODE
   ========================================= */

    this.seekingSubject.next(false);

    console.log('[SeekCoordinator] Seek complete:', targetSecond);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
