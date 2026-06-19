import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { RaceDataService } from './race-data.service';
import { DriverMetaService } from './driver-meta.service';
import { SectorAnchorService } from './sector-anchor.service';
import { LeaderboardService } from './leaderboard.service';
import { TrackStatusApiService } from './track-status-api.service';
import { TrackStatusService } from './track-status.service';
import { RaceLocalTimeService } from './race-local-time.service';
import { TrackMapService } from './track-map.service';
import { LiveTimingService } from './live-timing.service';
import { TelemetryBufferService } from './race-telemetry-buffer.service';
import { SimulationEngineService } from './simulation-engine.service';
import { TimingEventProcessorService } from './timing-event-processor.service';
import { WeatherStatusService } from './weather-status.service';
import { TrackMapStateService } from '../services/track-map-state.service';
import { RaceFinishService } from './race-finish.service';
import { DriverPresenceService } from './driver-presence.service';
import { FastestLapService } from './fastest-lap.service';
import { RaceControlService } from './race-control.service';
import { RaceApiResponse } from '../models/race-data.model';

export interface BootstrapStep {
  id: string;

  label: string;

  status: 'pending' | 'loading' | 'success' | 'error';

  retryCount?: number;
}

@Injectable({ providedIn: 'root' })
export class SimulationBootstrapService {
  private readonly MAX_RETRIES = 3;

  private availableDriversSubject = new BehaviorSubject<string[]>([]);
  availableDrivers$ = this.availableDriversSubject.asObservable();

  private raceDataSubject = new BehaviorSubject<RaceApiResponse | null>(null);

  raceData$: Observable<RaceApiResponse | null> =
    this.raceDataSubject.asObservable();

  constructor(
    private raceDataService: RaceDataService,
    private driverMeta: DriverMetaService,
    private sectorAnchors: SectorAnchorService,
    private leaderboard: LeaderboardService,
    private trackStatusApi: TrackStatusApiService,
    private trackStatus: TrackStatusService,
    private raceLocalTime: RaceLocalTimeService,
    private trackMap: TrackMapService,
    private liveTiming: LiveTimingService,
    private telemetry: TelemetryBufferService,
    private engine: SimulationEngineService,
    private timingProcessor: TimingEventProcessorService,
    private weatherService: WeatherStatusService,
    private trackMapState: TrackMapStateService,
    private raceFinish: RaceFinishService,
    private driverPresence: DriverPresenceService,
    private fastestLap: FastestLapService,
    private raceControl: RaceControlService,
  ) {}

  private stepsSubject = new BehaviorSubject<BootstrapStep[]>([]);

  steps$ = this.stepsSubject.asObservable();

  private bootstrapCompleteSubject = new BehaviorSubject<boolean>(false);

  bootstrapComplete$ = this.bootstrapCompleteSubject.asObservable();

  /** 🚦 SINGLE ENTRY POINT */
  startRace(config: { year: number; round: number }): void {
    this.initializeSteps();

    this.bootstrapCompleteSubject.next(false);

    const { year, round } = config;

    this.updateStep('race-data', 'loading');

    this.raceDataService.getRaceData(year, round).subscribe({
      next: (raceData) => {
        this.updateStep('race-data', 'success');
        /* ---------- STATIC META ---------- */
        this.driverMeta.initialize(raceData.drivers);
        this.sectorAnchors.initialize(raceData);
        this.raceFinish.initialize(raceData);
        this.fastestLap.initialize(raceData);

        this.leaderboard.setTotalLaps(raceData.session.totalLaps);
        this.leaderboard.initialize(raceData);
        this.availableDriversSubject.next(Object.keys(raceData.drivers));
        this.raceDataSubject.next(raceData);

        const outDrivers = raceData.results.classification
          .filter((result) => result.status === 'OUT')
          .map((result) => result.driver);

        this.driverPresence.setOfficiallyOutDrivers(outDrivers);

        /* ---------- TRACK STATUS ---------- */
        this.updateStep('track-status', 'loading');

        this.trackStatusApi.getTrackStatusData(year, round).subscribe({
          next: (res) => {
            this.trackStatus.initialize(res.trackStatusData);

            this.updateStep('track-status', 'success');
          },

          error: () => {
            this.updateStep('track-status', 'error');
          },
        });

        /* ---------- LOCAL TIME ---------- */
        this.updateStep('local-time', 'loading');

        this.raceLocalTime.initialize(raceData.session.localTimeAtRaceStart);

        this.updateStep('local-time', 'success');

        /* ---------- WEATHER ---------- */
        /* ---------- WEATHER ---------- */

        this.updateStep('weather', 'loading');

        this.weatherService.load(year, round).subscribe({
          next: (res) => {
            this.weatherService.setWeatherData(res.weatherData);

            this.updateStep('weather', 'success');
          },

          error: () => {
            this.updateStep('weather', 'error');
          },
        });

        /* ---------- RACE CONTROL ---------- */
        this.updateStep('race-control', 'loading');

        this.raceControl.getRaceControl(year, round).subscribe({
          next: () => {
            this.updateStep('race-control', 'success');
          },

          error: () => {
            this.updateStep('race-control', 'error');
          },
        });

        /* ---------- TRACK MAP → TIMING → TELEMETRY ---------- */

        this.updateStep('track-map', 'loading');

        this.trackMap.load(year, round).subscribe({
          next: (data) => {
            this.handleTrackMapSuccess(data, raceData, year, round);
          },

          error: async (err) => {
            console.error('TRACK MAP REQUEST FAILED', err);

            const trackMapStep = this.stepsSubject.value.find(
              (s) => s.id === 'track-map',
            );

            const retries = trackMapStep?.retryCount ?? 0;

            if (retries < this.MAX_RETRIES) {
              this.incrementRetry('track-map');

              console.log(
                `Retrying track map (${retries + 1}/${this.MAX_RETRIES})`,
              );

              await this.retryDelay(1000);

              this.updateStep('track-map', 'loading');

              this.trackMap.load(year, round).subscribe({
                next: (data) => {
                  this.handleTrackMapSuccess(data, raceData, year, round);
                },

                error: () => {
                  this.updateStep('track-map', 'error');
                },
              });

              return;
            }

            this.updateStep('track-map', 'error');
          },
        });
      },

      error: () => {
        this.updateStep('race-data', 'error');
      },
    });
  }

  private handleTrackMapSuccess(
    data: any,
    raceData: RaceApiResponse,
    year: number,
    round: number,
  ): void {
    this.trackMapState.setTrackData(data);

    this.updateStep('track-map', 'success');

    const trackLength = data.trackInfo.trackLength;

    if (!trackLength) {
      throw new Error('Track length not available');
    }

    const timingLoopCount = data.trackInfo.timingLoopCount;

    if (timingLoopCount !== null) {
      this.timingProcessor.setTimingLoopCount(timingLoopCount);
    }

    this.liveTiming.initialize(raceData, trackLength);

    this.updateStep('telemetry', 'loading');

    this.telemetry.initialize(year, round, trackLength).subscribe({
      next: () => {
        this.updateStep('telemetry', 'success');

        this.updateStep('engine', 'loading');

        this.engine.initialize();

        this.updateStep('engine', 'success');

        this.bootstrapCompleteSubject.next(true);
      },

      error: () => {
        this.updateStep('telemetry', 'error');
      },
    });
  }

  private retryDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private incrementRetry(id: string): void {
    const updated = this.stepsSubject.value.map((step) =>
      step.id === id
        ? {
            ...step,
            retryCount: (step.retryCount ?? 0) + 1,
          }
        : step,
    );

    this.stepsSubject.next(updated);
  }

  private initializeSteps(): void {
    this.stepsSubject.next([
      {
        id: 'race-data',
        label: 'Loading race data',
        status: 'pending',
      },
      {
        id: 'track-map',
        label: 'Building track map',
        status: 'pending',
      },
      {
        id: 'weather',
        label: 'Loading weather information',
        status: 'pending',
      },
      {
        id: 'track-status',
        label: 'Loading track status',
        status: 'pending',
      },
      {
        id: 'race-control',
        label: 'Loading race control messages',
        status: 'pending',
      },
      {
        id: 'local-time',
        label: 'Synchronizing local track time',
        status: 'pending',
      },
      {
        id: 'telemetry',
        label: 'Loading telemetry',
        status: 'pending',
      },
      {
        id: 'engine',
        label: 'Initializing simulation engine',
        status: 'pending',
      },
    ]);
  }

  private updateStep(id: string, status: BootstrapStep['status']): void {
    const updated = this.stepsSubject.value.map((step) =>
      step.id === id ? { ...step, status } : step,
    );

    this.stepsSubject.next(updated);
  }
}
