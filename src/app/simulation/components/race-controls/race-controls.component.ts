import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LeaderboardDisplayService } from '../../../core/services/leaderboard-display.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { RaceFinishService } from '../../../core/services/race-finish.service';
import { LeaderboardService } from '../../../core/services/leaderboard.service';

@Component({
  selector: 'app-race-controls',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './race-controls.component.html',
  styleUrl: './race-controls.component.scss',
})
export class RaceControlsComponent {
  constructor(
    private leaderboardDisplay: LeaderboardDisplayService,
    private leaderboardService: LeaderboardService,
  ) {}

  showTyre(): void {
    if (this.isPreRace) {
      return;
    }

    this.leaderboardDisplay.showTemporaryMode('TYRE');
  }

  showPit(): void {
    if (this.isPreRace) {
      return;
    }

    this.leaderboardDisplay.showTemporaryMode('PIT');
  }

  showLapped(): void {
    if (this.isPreRace) {
      return;
    }

    this.leaderboardDisplay.showTemporaryMode('LAPPED');
  }

  get isPreRace(): boolean {
    return this.leaderboardService.isShowingStartingGrid();
  }
}
