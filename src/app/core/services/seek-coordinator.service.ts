import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { RaceClockService } from './race-clock-service';
import { TimingEventProcessorService } from './timing-event-processor.service';
import { TelemetryInterpolationService } from './telemetry-interpolation.service';
import { DriverPresenceService } from './driver-presence.service';

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
  ) {}

  /**
   * Centralized replay seek orchestration.
   *
   * ALL discontinuous timeline jumps
   * must go through this service.
   */
  seekToRaceSecond(targetSecond: number): void {
    console.log('[SeekCoordinator] Starting seek:', targetSecond);

    /* =========================================
     1. ENTER SEEK MODE
     ========================================= */

    this.seekingSubject.next(true);

    /* =========================================
     2. PAUSE PLAYBACK
     ========================================= */

    this.clock.pause();

    /* =========================================
     3. RESET STATEFUL REPLAY SERVICES
     ========================================= */

    this.timingProcessor.reset();

    /**
     * Interpolation continuity becomes invalid
     * after discontinuous timeline jumps.
     */
    this.telemetryInterpolation.resetAfterSeek();

    /* =========================================
     4. SEEK CLOCK
     ========================================= */

    this.clock.seekTo(targetSecond);

    /* =========================================
     5. EXIT SEEK MODE
     ========================================= */

    this.seekingSubject.next(false);

    console.log('[SeekCoordinator] Seek complete:', targetSecond);
  }
}
