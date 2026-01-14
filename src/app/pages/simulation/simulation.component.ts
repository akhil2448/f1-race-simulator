import { Component, OnInit } from '@angular/core';
import { LeaderboardComponent } from '../../simulation/components/leaderboard/leaderboard.component';
import { TrackMapComponent } from '../../simulation/components/track-map/track-map.component';
import { RaceClockComponent } from '../../simulation/components/race-clock/race-clock.component';
import { WeatherComponent } from '../../simulation/components/weather/weather.component';
import { DriverComponent } from '../../simulation/components/driver/driver.component';
import { RaceClockService } from '../../core/services/race-clock-service';
import { TelemetryBufferService } from '../../core/services/race-telemetry-buffer.service';
import { SimulationEngineService } from '../../core/services/simulation-engine.service';

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
    private engine: SimulationEngineService
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

    // Run SimulationEngineSerice & RaceClock
    //-------------------------------------------------
    this.telemetry.initialize(2021, 7).subscribe(() => {
      this.engine.initialize();
      //this.raceClock.setSpeed(4);
      this.raceClock.play();
    });
  }
}
