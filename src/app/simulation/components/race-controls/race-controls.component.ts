import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LeaderboardDisplayMode,
  LeaderboardDisplayService,
} from '../../../core/services/leaderboard-display.service';
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
export class RaceControlsComponent implements OnInit {
  activeTemporaryMode: LeaderboardDisplayMode | null = null;

  isMobileLandscape = false;

  constructor(
    private leaderboardDisplay: LeaderboardDisplayService,
    private leaderboardService: LeaderboardService,
  ) {
    this.leaderboardDisplay.temporaryMode$.subscribe((mode) => {
      this.activeTemporaryMode = mode;
    });
  }

  ngOnInit(): void {
    this.updateViewport();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewport();
  }

  private updateViewport(): void {
    this.isMobileLandscape = window.matchMedia(
      '(max-width: 1024px) and (orientation: landscape)',
    ).matches;
  }

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

  showGainLoss(): void {
    if (this.isPreRace) {
      return;
    }

    this.leaderboardDisplay.showTemporaryMode('GAINED_LOST');
  }

  get isPreRace(): boolean {
    return this.leaderboardService.isShowingStartingGrid();
  }
}
