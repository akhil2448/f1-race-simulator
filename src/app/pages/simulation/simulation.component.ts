import { Component, OnInit } from '@angular/core';
import { LeaderboardComponent } from '../../simulation/components/leaderboard/leaderboard.component';
import { TrackMapComponent } from '../../simulation/components/track-map/track-map.component';
import { RaceClockComponent } from '../../simulation/components/race-clock/race-clock.component';
import { WeatherComponent } from '../../simulation/components/weather/weather.component';
import { DriverTelemetryComponent } from '../../simulation/components/driver-telemetry/driver-telemetry.component';

import { RaceClockService } from '../../core/services/race-clock-service';
import { TelemetryBufferService } from '../../core/services/race-telemetry-buffer.service';
import { SimulationEngineService } from '../../core/services/simulation-engine.service';
import { TrackMapService } from '../../core/services/track-map.service';
import { RaceDataService } from '../../core/services/race-data.service';
import { DriverStateService } from '../../core/services/driver-state.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { DriverMetaService } from '../../core/services/driver-meta.service';
import { TrackStatusApiService } from '../../core/services/track-status-api.service';
import { TrackStatusService } from '../../core/services/track-status.service';
import { RaceLocalTimeService } from '../../core/services/race-local-time.service';
import { LiveTimingService } from '../../core/services/live-timing.service';
import { SectorAnchorService } from '../../core/services/sector-anchor.service';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    LeaderboardComponent,
    TrackMapComponent,
    RaceClockComponent,
    WeatherComponent,
    DriverTelemetryComponent,
  ],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.scss',
})
export class SimulationComponent implements OnInit {
  availableDrivers: string[] = [];
  selectedDrivers: (string | null)[] = [null, null];

  constructor(
    private raceClock: RaceClockService,
    private telemetry: TelemetryBufferService,
    private engine: SimulationEngineService,
    private trackMap: TrackMapService,
    private raceDataService: RaceDataService,
    private driverStateService: DriverStateService,
    private leaderboardService: LeaderboardService,
    private driverMetaService: DriverMetaService,
    private trackStatusApiService: TrackStatusApiService,
    private trackStatusService: TrackStatusService,
    private raceLocalTimeService: RaceLocalTimeService,
    private liveTimingService: LiveTimingService,
    private sectorAnchorService: SectorAnchorService,
  ) {}

  ngOnInit(): void {
    this.raceDataService.getRaceData(2021, 7).subscribe((raceData) => {
      // ----- STATIC META DATA -------
      this.driverMetaService.initialize(raceData.drivers);

      // ✅ SECTOR ANCHORS (NEW — MUST BE BEFORE LIVE TIMING)
      this.sectorAnchorService.initialize(raceData);

      /* ----------------------------------------
   SANITY CHECK (DEV ONLY)
   ---------------------------------------- */
      if (!this.sectorAnchorService.hasAnchors()) {
        console.error('[SectorAnchor] No sector anchors built!');
      } else {
        console.log(
          '[SectorAnchor] Initialized for',
          this.sectorAnchorService.getDriverCount(),
          'drivers',
        );
      }

      // ----- LEADERBOARD META ---------
      this.leaderboardService.setTotalLaps(raceData.session.totalLaps);

      //this.leaderboardService.initializeTyreLife(raceData.drivers);

      // ----- DROPDOWN FOR DRIVER TELEMETRY --------
      this.availableDrivers = Object.keys(raceData.drivers);

      // ------- TRACK STATUS ----------
      this.trackStatusApiService
        .getTrackStatusData(2021, 7)
        .subscribe((res) =>
          this.trackStatusService.initialize(res.trackStatusData),
        );

      // ------ LOCAL TIME CLOCK
      this.raceLocalTimeService.initialize(
        raceData.session.localTimeAtRaceStart,
      );

      // --- LOAD TRACK MAP FIRST ---
      this.trackMap.load(2021, 7).subscribe(() => {
        // Extract track length safely
        const trackLengthMeters = this.trackMap.getTrackLength();

        if (!trackLengthMeters) {
          throw new Error('Track length not available');
        }

        // ✅ AUTHORITATIVE TIMING — now has track length
        this.liveTimingService.initialize(raceData, trackLengthMeters);

        // --- NOW initialize telemetry with track length ---
        this.telemetry.initialize(2021, 7, trackLengthMeters).subscribe(() => {
          this.engine.initialize();
        });
      });
    });
  }

  getAvailableDriversForSlot(slot: number): string[] {
    const other = this.selectedDrivers[slot === 0 ? 1 : 0];
    return this.availableDrivers.filter((d) => d !== other);
  }

  onDriverSelected(slot: number, driver: string): void {
    this.selectedDrivers[slot] = driver;
  }

  getDriverColor(driver: string | null): string | null {
    if (!driver) return null;
    return this.driverMetaService.get(driver)?.color ?? null;
  }

  onDriverCleared(slot: number): void {
    this.selectedDrivers[slot] = null;
  }
}
