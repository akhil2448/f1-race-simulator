import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class SimulationBootstrapService {
  private availableDriversSubject = new BehaviorSubject<string[]>([]);
  availableDrivers$ = this.availableDriversSubject.asObservable();

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
  ) {}

  /** 🚦 SINGLE ENTRY POINT */
  startRace(config: { year: number; round: number }): void {
    const { year, round } = config;

    this.raceDataService.getRaceData(year, round).subscribe((raceData) => {
      /* ---------- STATIC META ---------- */
      this.driverMeta.initialize(raceData.drivers);
      this.sectorAnchors.initialize(raceData);

      this.leaderboard.setTotalLaps(raceData.session.totalLaps);
      this.availableDriversSubject.next(Object.keys(raceData.drivers));

      /* ---------- TRACK STATUS ---------- */
      this.trackStatusApi
        .getTrackStatusData(year, round)
        .subscribe((res) => this.trackStatus.initialize(res.trackStatusData));

      /* ---------- LOCAL TIME ---------- */
      this.raceLocalTime.initialize(raceData.session.localTimeAtRaceStart);

      /* ---------- TRACK MAP → TIMING → TELEMETRY ---------- */
      this.trackMap.load(year, round).subscribe(() => {
        const trackLength = this.trackMap.getTrackLength();
        if (!trackLength) {
          throw new Error('Track length not available');
        }

        this.liveTiming.initialize(raceData, trackLength);

        this.telemetry.initialize(year, round, trackLength).subscribe(() => {
          this.engine.initialize();
        });
      });
    });
  }
}
