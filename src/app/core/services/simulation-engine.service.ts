import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { RaceClockService } from './race-clock-service';
import { TelemetryBufferService } from './race-telemetry-buffer.service';
import { TelemetryFrame } from '../models/race-telemetry.model';
import { TrackMapService } from './track-map.service';

@Injectable({
  providedIn: 'root',
})
export class SimulationEngineService {
  /** Emits the current simulation frame */
  private currentFrameSubject = new BehaviorSubject<TelemetryFrame | null>(
    null,
  );
  frame$ = this.currentFrameSubject.asObservable();

  private clockSub?: Subscription;
  private initialized = false;

  private trackLengthMeters = 0;

  private lastRaceDistance = new Map<string, number>();

  private lastComputedLap = new Map<string, number>();

  constructor(
    private clock: RaceClockService,
    private telemetry: TelemetryBufferService,
    private trackMap: TrackMapService,
  ) {}

  /**
   * MUST be called once telemetry data is loaded
   */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Get track length ONCE
    this.trackMap.track$.subscribe((data) => {
      if (data) {
        this.trackLengthMeters = data.trackInfo.trackLength;
      }
    });

    this.clockSub = this.clock.raceTime$.subscribe((second) => {
      const frame = this.telemetry.getFrame(second);
      if (!frame || !this.trackLengthMeters) return;

      const cars = frame.cars.map((car) => {
        const prevRaceDist = this.lastRaceDistance.get(car.driver) ?? 0;

        // 🔒 Monotonic race distance
        const safeRaceDist = Math.max(car.raceDistance, prevRaceDist);
        this.lastRaceDistance.set(car.driver, safeRaceDist);

        // 🔑 Deterministic lap math
        const lap = Math.floor(safeRaceDist / this.trackLengthMeters) + 1;
        const lapDistance = safeRaceDist % this.trackLengthMeters;

        const prevLap = this.lastComputedLap.get(car.driver) ?? lap;

        if (lap !== prevLap) {
          // console.log('[LAP]', car.driver, '→', lap);
        }

        this.lastComputedLap.set(car.driver, lap);

        return {
          ...car,
          lap,
          lapDistance,
          raceDistance: safeRaceDist,
        };
      });

      this.currentFrameSubject.next({
        ...frame,
        cars,
      });
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

  getTrackLengthMeters(): number {
    return this.trackLengthMeters;
  }
}
