import { Component } from '@angular/core';
import { LeaderboardComponent } from '../../simulation/components/leaderboard/leaderboard.component';
import { TrackMapComponent } from '../../simulation/components/track-map/track-map.component';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [LeaderboardComponent, TrackMapComponent],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.scss',
})
export class SimulationComponent {}
