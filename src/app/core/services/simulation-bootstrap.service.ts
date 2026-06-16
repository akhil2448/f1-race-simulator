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

@Injectable({ providedIn: 'root' })
export class SimulationBootstrapService {
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

  /** 🚦 SINGLE ENTRY POINT */
  startRace(config: { year: number; round: number }): void {
    const { year, round } = config;

    this.raceDataService.getRaceData(year, round).subscribe((raceData) => {
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
      this.trackStatusApi
        .getTrackStatusData(year, round)
        .subscribe((res) => this.trackStatus.initialize(res.trackStatusData));

      /* ---------- LOCAL TIME ---------- */
      this.raceLocalTime.initialize(raceData.session.localTimeAtRaceStart);

      /* ---------- WEATHER ---------- */
      this.weatherService.load(year, round);

      /* ---------- RACE CONTROL ---------- */
      this.raceControl.getRaceControl(year, round).subscribe();

      /* ---------- TRACK MAP → TIMING → TELEMETRY ---------- */
      this.trackMap.load(year, round).subscribe((data) => {
        this.trackMapState.setTrackData(data);

        const trackLength = data.trackInfo.trackLength;

        if (!trackLength) {
          throw new Error('Track length not available');
        }

        const timingLoopCount = data.trackInfo.timingLoopCount;

        if (timingLoopCount !== null) {
          this.timingProcessor.setTimingLoopCount(timingLoopCount);
        }

        this.liveTiming.initialize(raceData, trackLength);

        this.telemetry.initialize(year, round, trackLength).subscribe(() => {
          this.engine.initialize();
        });
      });
    });
  }
}
