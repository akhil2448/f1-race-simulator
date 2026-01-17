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
  ) {}

  ngOnInit(): void {
    this.raceDataService.getRaceData(2021, 7).subscribe((raceData) => {
      this.driverMetaService.initialize(raceData.drivers);
      this.driverStateService.initialize(raceData);
      this.leaderboardService.setTotalLaps(raceData.session.totalLaps);
      this.leaderboardService.initializeTyreLife(raceData.drivers);

      this.availableDrivers = Object.keys(raceData.drivers);

      this.trackStatusApiService
        .getTrackStatusData(2021, 7)
        .subscribe((res) =>
          this.trackStatusService.initialize(res.trackStatusData),
        );

      this.telemetry.initialize(2021, 7).subscribe(() => {
        this.trackMap.load(2021, 7).subscribe(() => {
          this.engine.initialize();
          this.raceClock.play();
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
