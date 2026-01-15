import { Component, OnInit } from '@angular/core';
import { LeaderboardComponent } from '../../simulation/components/leaderboard/leaderboard.component';
import { TrackMapComponent } from '../../simulation/components/track-map/track-map.component';
import { RaceClockComponent } from '../../simulation/components/race-clock/race-clock.component';
import { WeatherComponent } from '../../simulation/components/weather/weather.component';
import { DriverComponent } from '../../simulation/components/driver/driver.component';
import { RaceClockService } from '../../core/services/race-clock-service';
import { TelemetryBufferService } from '../../core/services/race-telemetry-buffer.service';
import { SimulationEngineService } from '../../core/services/simulation-engine.service';
import { TrackMapService } from '../../core/services/track-map.service';
import { RaceDataService } from '../../core/services/race-data.service';
import { DriverStateService } from '../../core/services/driver-state.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { DriverMetaService } from '../../core/services/driver-meta.service';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    LeaderboardComponent,
    TrackMapComponent,
    RaceClockComponent,
    WeatherComponent,
    DriverComponent,
  ],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.scss',
})
export class SimulationComponent implements OnInit {
  constructor(
    private raceClock: RaceClockService,
    private telemetry: TelemetryBufferService,
    private engine: SimulationEngineService,
    private trackMap: TrackMapService,
    private raceDataService: RaceDataService,
    private driverStateService: DriverStateService,
    private leaderboardService: LeaderboardService,
    private driverMetaService: DriverMetaService
  ) {}

  ngOnInit() {
    // TEST RaceClockService
    //-------------------------------------------------
    // this.raceClock.raceTime$.subscribe((sec) => {
    //   console.log('Race second:', sec);
    // });
    // this.raceClock.play();
    // this.raceClock.setSpeed(0.5);

    // TEST RaceTelemetryBufferService
    //-------------------------------------------------
    // this.telemetry.loadChunk(2021, 7, 0, 600).subscribe(() => {
    //   console.log('Frame @10:', this.telemetry.getFrame(10));
    //   console.log('Frame @120:', this.telemetry.getFrame(120));
    //   console.log('Telemetry loaded');
    // });

    // TEST SimulationEngineService
    //-------------------------------------------------
    // 👂 Listen to engine output
    // this.telemetry.loadChunk(2021, 7, 0, 600).subscribe(() => {
    //   this.engine.initialize();
    //   this.raceClock.play();
    // });
    // 📦 Load telemetry, then start simulation
    // this.engine.frame$.subscribe((frame) => {
    //   if (!frame) return;
    //   console.log('Engine frame:', frame.raceTime, frame.cars.length);
    // });

    // Run TrackMapService, SimulationEngineSerice & RaceClock
    //-------------------------------------------------
    this.raceDataService.getRaceData(2021, 7).subscribe((raceData) => {
      this.driverMetaService.initialize(raceData.drivers);

      // 1️⃣ Initialize driver state (pit windows, compounds)
      this.driverStateService.initialize(raceData);

      this.leaderboardService.setTotalLaps(raceData.session.totalLaps);

      // 2️⃣ Initialize telemetry
      this.telemetry.initialize(2021, 7).subscribe(() => {
        // 3️⃣ Load track map
        this.trackMap.load(2021, 7).subscribe(() => {
          // 4️⃣ Initialize simulation engine
          this.engine.initialize();

          // 5️⃣ Start race clock LAST
          this.raceClock.play();
        });
      });
    });
  }
}
