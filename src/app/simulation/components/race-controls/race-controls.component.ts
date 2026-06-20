import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LeaderboardDisplayService } from '../../../core/services/leaderboard-display.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SupportButtonComponent } from '../../../shared/components/support-button/support-button.component';
import { RaceFinishService } from '../../../core/services/race-finish.service';

@Component({
  selector: 'app-race-controls',
  standalone: true,
  imports: [CommonModule, ButtonComponent, SupportButtonComponent],
  templateUrl: './race-controls.component.html',
  styleUrl: './race-controls.component.scss',
})
export class RaceControlsComponent {
  raceFinished = false;

  constructor(
    private leaderboardDisplay: LeaderboardDisplayService,
    private raceFinish: RaceFinishService,
  ) {}

  ngOnInit(): void {
    this.raceFinish.raceFinished$.subscribe((finished) => {
      this.raceFinished = finished;
    });
  }

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
