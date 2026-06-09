import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LeaderboardDisplayService } from '../../../core/services/leaderboard-display.service';

@Component({
  selector: 'app-race-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-controls.component.html',
  styleUrl: './race-controls.component.scss',
})
export class RaceControlsComponent {
  constructor(private leaderboardDisplay: LeaderboardDisplayService) {}

  showTyre(): void {
    this.leaderboardDisplay.showTemporaryMode('TYRE');
  }

  showPit(): void {
    this.leaderboardDisplay.showTemporaryMode('PIT');
  }

  showLapped(): void {
    this.leaderboardDisplay.showTemporaryMode('LAPPED');
  }
}
