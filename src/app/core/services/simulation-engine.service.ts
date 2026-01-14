import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { RaceClockService } from './race-clock-service';
import { TelemetryBufferService } from './race-telemetry-buffer.service';
import { TelemetryFrame } from '../models/race-telemetry.model';

@Injectable({
  providedIn: 'root',
})
export class SimulationEngineService {
  /** Emits the current simulation frame */
  private currentFrameSubject = new BehaviorSubject<TelemetryFrame | null>(
    null
  );
  frame$ = this.currentFrameSubject.asObservable();

  private clockSub?: Subscription;
  private initialized = false;

  constructor(
    private clock: RaceClockService,
    private telemetry: TelemetryBufferService
  ) {}

  /**
   * MUST be called once telemetry data is loaded
   */
  initialize(): void {
    if (this.initialized) return;

    this.initialized = true;

    this.clockSub = this.clock.raceTime$.subscribe((second) => {
      const frame = this.telemetry.getFrame(second);

      if (!frame) return;

      this.currentFrameSubject.next(frame);
    });
  }

  /**
   * Optional cleanup (useful for future race switching)
   */
  destroy(): void {
    this.clockSub?.unsubscribe();
    this.clockSub = undefined;
    this.initialized = false;
    this.currentFrameSubject.next(null);
  }
}
