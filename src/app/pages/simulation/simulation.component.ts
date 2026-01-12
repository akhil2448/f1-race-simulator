import { Component } from '@angular/core';
import { LeaderboardComponent } from '../../simulation/components/leaderboard/leaderboard.component';
import { TrackMapComponent } from '../../simulation/components/track-map/track-map.component';
import { RaceClockComponent } from '../../simulation/components/race-clock/race-clock.component';
import { WeatherComponent } from '../../simulation/components/weather/weather.component';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    LeaderboardComponent,
    TrackMapComponent,
    RaceClockComponent,
    WeatherComponent,
  ],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.scss',
})
export class SimulationComponent {}
