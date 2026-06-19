import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timeout } from 'rxjs';

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

export type BootstrapFailureType = 'none' | 'mandatory' | 'optional';

@Injectable({ providedIn: 'root' })
export class SimulationBootstrapService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

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

  private failureTypeSubject = new BehaviorSubject<BootstrapFailureType>(
    'none',
  );

  failureType$ = this.failureTypeSubject.asObservable();

  private failedStepsSubject = new BehaviorSubject<string[]>([]);

  failedSteps$ = this.failedStepsSubject.asObservable();

  private optionalFailuresDetected = false;

  /** 🚦 SINGLE ENTRY POINT */
  startRace(config: { year: number; round: number }): void {
    this.optionalFailuresDetected = false;

    this.initializeSteps();

    this.bootstrapCompleteSubject.next(false);

    this.failureTypeSubject.next('none');

    this.failedStepsSubject.next([]);

    const { year, round } = config;

    this.loadRaceDataWithRetry(year, round);
  }

  private handleRetry(stepId: string, retryAction: () => void): void {
    const retries = this.getRetryCount(stepId);

    if (retries < this.MAX_RETRIES) {
      this.incrementRetry(stepId);

      setTimeout(() => {
        retryAction();
      }, this.RETRY_DELAY_MS);

      return;
    }

    this.updateStep(stepId, 'error');

    this.addFailedStep(stepId);

    if (this.isMandatoryStep(stepId)) {
      this.failureTypeSubject.next('mandatory');
      return;
    }

    this.optionalFailuresDetected = true;
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
      console.error('Track length not available');

      this.updateStep('track-map', 'error');

      this.addFailedStep('track-map');

      this.failureTypeSubject.next('mandatory');

      return;
    }

    const timingLoopCount = data.trackInfo.timingLoopCount;

    if (timingLoopCount !== null) {
      this.timingProcessor.setTimingLoopCount(timingLoopCount);
    }

    this.liveTiming.initialize(raceData, trackLength);

    this.loadTelemetryWithRetry(year, round, trackLength);
  }

  private loadRaceControlWithRetry(year: number, round: number): void {
    this.updateStep('race-control', 'loading');

    this.raceControl.getRaceControl(year, round).subscribe({
      next: () => {
        this.updateStep('race-control', 'success');
      },

      error: (err) => {
        console.error('RACE CONTROL REQUEST FAILED', err);

        this.handleRetry('race-control', () =>
          this.loadRaceControlWithRetry(year, round),
        );
      },
    });
  }

  private loadWeatherWithRetry(year: number, round: number): void {
    this.updateStep('weather', 'loading');

    this.weatherService.load(year, round).subscribe({
      next: (res) => {
        this.weatherService.setWeatherData(res.weatherData);

        this.updateStep('weather', 'success');
      },

      error: (err) => {
        console.error('WEATHER REQUEST FAILED', err);

        this.handleRetry('weather', () =>
          this.loadWeatherWithRetry(year, round),
        );
      },
    });
  }

  private loadTrackStatusWithRetry(year: number, round: number): void {
    this.updateStep('track-status', 'loading');

    this.trackStatusApi.getTrackStatusData(year, round).subscribe({
      next: (res) => {
        this.trackStatus.initialize(res.trackStatusData);

        this.updateStep('track-status', 'success');
      },

      error: (err) => {
        console.error('TRACK STATUS REQUEST FAILED', err);

        this.handleRetry('track-status', () =>
          this.loadTrackStatusWithRetry(year, round),
        );
      },
    });
  }

  private loadRaceDataWithRetry(year: number, round: number): void {
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

        /* Continue bootstrap flow */

        this.loadTrackStatusWithRetry(year, round);

        this.loadWeatherWithRetry(year, round);

        this.loadRaceControlWithRetry(year, round);

        this.updateStep('local-time', 'loading');

        this.raceLocalTime.initialize(raceData.session.localTimeAtRaceStart);

        this.updateStep('local-time', 'success');

        this.loadTrackMapWithRetry(year, round, raceData);
      },

      error: (err) => {
        console.error('RACE DATA REQUEST FAILED', err);

        this.handleRetry('race-data', () =>
          this.loadRaceDataWithRetry(year, round),
        );
      },
    });
  }

  private loadTrackMapWithRetry(
    year: number,
    round: number,
    raceData: RaceApiResponse,
  ): void {
    this.updateStep('track-map', 'loading');

    this.trackMap.load(year, round).subscribe({
      next: (data) => {
        this.handleTrackMapSuccess(data, raceData, year, round);
      },

      error: (err) => {
        console.error('TRACK MAP FAILED', err);

        this.handleRetry('track-map', () =>
          this.loadTrackMapWithRetry(year, round, raceData),
        );
      },
    });
  }

  private loadTelemetryWithRetry(
    year: number,
    round: number,
    trackLength: number,
  ): void {
    this.updateStep('telemetry', 'loading');

    this.telemetry
      .initialize(year, round, trackLength)
      .pipe(timeout(30000))
      .subscribe({
        next: () => {
          this.updateStep('telemetry', 'success');

          this.initializeEngine();
        },

        error: (err) => {
          console.error('TELEMETRY LOAD FAILED', err);

          this.handleRetry('telemetry', () =>
            this.loadTelemetryWithRetry(year, round, trackLength),
          );
        },
      });
  }

  private initializeEngine(): void {
    this.updateStep('engine', 'loading');

    try {
      this.engine.initialize();

      this.updateStep('engine', 'success');

      this.completeBootstrap();
    } catch (err) {
      console.error('ENGINE INITIALIZATION FAILED', err);

      this.updateStep('engine', 'error');

      this.failureTypeSubject.next('mandatory');

      this.addFailedStep('engine');
    }
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

  private getRetryCount(id: string): number {
    return this.stepsSubject.value.find((s) => s.id === id)?.retryCount ?? 0;
  }

  private isMandatoryStep(stepId: string): boolean {
    return ['race-data', 'track-map', 'telemetry', 'engine'].includes(stepId);
  }

  private addFailedStep(stepId: string): void {
    const current = this.failedStepsSubject.value;

    if (!current.includes(stepId)) {
      this.failedStepsSubject.next([...current, stepId]);
    }
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

  private completeBootstrap(): void {
    setTimeout(() => {
      if (this.optionalFailuresDetected) {
        this.failureTypeSubject.next('optional');

        return;
      }

      this.bootstrapCompleteSubject.next(true);
    }, 1000);
  }
}
