import { Component, OnInit } from '@angular/core';
import { DriverMetaService } from '../../core/services/driver-meta.service';
import { SimulationBootstrapService } from '../../core/services/simulation-bootstrap.service';
import { LeaderboardComponent } from '../../simulation/components/leaderboard/leaderboard.component';
import { WeatherComponent } from '../../simulation/components/weather/weather.component';
import { DriverTelemetryComponent } from '../../simulation/components/driver-telemetry/driver-telemetry.component';
import { RaceClockComponent } from '../../simulation/components/race-clock/race-clock.component';
import { TrackMapComponent } from '../../simulation/components/track-map/track-map.component';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    LeaderboardComponent,
    WeatherComponent,
    DriverTelemetryComponent,
    RaceClockComponent,
    TrackMapComponent,
  ],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.scss',
})
export class SimulationComponent implements OnInit {
  availableDrivers: string[] = [];
  selectedDrivers: (string | null)[] = [null, null];

  constructor(
    private bootstrap: SimulationBootstrapService,
    private driverMetaService: DriverMetaService,
  ) {}

  ngOnInit(): void {
    this.bootstrap.startRace({ year: 2020, round: 3 });

    this.bootstrap.availableDrivers$.subscribe((drivers) => {
      this.availableDrivers = drivers;
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
