import { Component } from '@angular/core';
import { LeaderboardEntry } from '../../../core/models/leaderboard-entry.model';
import { LeaderboardService } from '../../../core/services/leaderboard.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent {
  leaderboard: LeaderboardEntry[] = [];
  leaderLap = 0;
  totalLaps = 0;

  constructor(private leaderboardService: LeaderboardService) {}

  ngOnInit(): void {
    this.leaderboardService.leaderboard$.subscribe((state) => {
      this.leaderboard = state.entries;
      this.leaderLap = state.leaderLap;
      this.totalLaps = state.totalLaps;
    });
  }

  formatGap(gap: number): string {
    if (gap === 0) return 'LEADER';
    return `+${gap.toFixed(3)}`;
  }
}
