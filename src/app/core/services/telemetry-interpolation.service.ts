import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TelemetryFrame, TelemetryCar } from '../models/race-telemetry.model';
import { SimulationEngineService } from './simulation-engine.service';
import { RaceClockService } from './race-clock-service';

/**
 * Smooth 60fps interpolation of telemetry frames.
 *
 * ✔ Speed-safe (0.5x / 1x / 2x / 4x)
 * ✔ Pause-safe (NO jitter after resume)
 * ✔ Deterministic
 * ✔ Interpolates DISTANCE only
 */
@Injectable({
  providedIn: 'root',
})
export class TelemetryInterpolationService {
  /* ===================================================== */
  /* OUTPUT STREAM                                         */
  /* ===================================================== */

  private interpolatedFrameSubject = new BehaviorSubject<TelemetryFrame | null>(
    null
  );

  interpolatedFrame$ = this.interpolatedFrameSubject.asObservable();

  /* ===================================================== */
  /* INTERNAL STATE                                        */
  /* ===================================================== */

  private prevFrame?: TelemetryFrame;
  private currFrame?: TelemetryFrame;

  /** Wall-clock time when current frame became active */
  private frameStartTime = 0;

  /** Actual real-time duration between frames */
  private frameDurationMs = 1000;

  private rafId?: number;

  /** Used to detect pause → resume transition */
  private wasPaused = true;

  constructor(
    private engine: SimulationEngineService,
    private clock: RaceClockService
  ) {
    /* ---------- PAUSE / RESUME HANDLING ---------- */
    this.clock.isPaused$.subscribe((paused) => {
      if (this.wasPaused && !paused) {
        // Pause → Play transition detected
        this.resetInterpolationTiming();
      }
      this.wasPaused = paused;
    });

    /* ---------- TELEMETRY FRAMES ---------- */
    this.engine.frame$.subscribe((frame) => {
      if (!frame) return;

      const now = performance.now();

      // Shift frames
      this.prevFrame = this.currFrame;
      this.currFrame = frame;

      // Measure real frame duration ONLY if not paused
      if (this.frameStartTime > 0) {
        this.frameDurationMs = Math.max(
          now - this.frameStartTime,
          1 // safety guard
        );
      }

      this.frameStartTime = now;

      // Start render loop once
      if (!this.rafId) {
        this.startRenderLoop();
      }
    });
  }

  /* ===================================================== */
  /* RENDER LOOP (≈60 FPS)                                 */
  /* ===================================================== */

  private startRenderLoop(): void {
    const loop = () => {
      if (!this.prevFrame || !this.currFrame) {
        this.rafId = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      const elapsedMs = now - this.frameStartTime;

      /**
       * Interpolate using REAL frame duration.
       * Clamp to [0,1] to avoid overshoot.
       */
      const t = Math.min(elapsedMs / this.frameDurationMs, 1);

      const interpolated = this.interpolateFrame(
        this.prevFrame,
        this.currFrame,
        t
      );

      this.interpolatedFrameSubject.next(interpolated);

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  /* ===================================================== */
  /* INTERPOLATION LOGIC                                   */
  /* ===================================================== */

  private interpolateFrame(
    prev: TelemetryFrame,
    curr: TelemetryFrame,
    t: number
  ): TelemetryFrame {
    const cars: TelemetryCar[] = curr.cars.map((currCar) => {
      const prevCar = prev.cars.find((c) => c.driver === currCar.driver);

      // First frame / new car → no interpolation
      if (!prevCar) {
        return currCar;
      }

      return {
        ...currCar,

        /**
         * Linear interpolation of DISTANCE ONLY.
         * Lap, pit state, status remain discrete.
         */
        distance: prevCar.distance + (currCar.distance - prevCar.distance) * t,
      };
    });

    return {
      ...curr,
      cars,
    };
  }

  /* ===================================================== */
  /* RESET ON PAUSE → PLAY                                 */
  /* ===================================================== */

  private resetInterpolationTiming(): void {
    /**
     * Pause breaks time continuity.
     * We must NOT interpolate across pause.
     */
    this.prevFrame = this.currFrame;
    this.frameStartTime = performance.now();
    this.frameDurationMs = 1000;
  }

  /* ===================================================== */
  /* CLEANUP                                              */
  /* ===================================================== */

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }

    this.prevFrame = undefined;
    this.currFrame = undefined;
    this.frameStartTime = 0;
    this.frameDurationMs = 1000;

    this.interpolatedFrameSubject.next(null);
  }
}
