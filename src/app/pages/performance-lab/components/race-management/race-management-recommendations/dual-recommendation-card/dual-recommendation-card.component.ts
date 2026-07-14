import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import {
  DualRecommendationCard,
  RaceRecommendationDriver,
  RecommendationPair,
} from '../../../../models/race-management-recommendation.model';
import { TeamUiService } from '../../../../services/team-ui.service';

@Component({
  selector: 'app-dual-recommendation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dual-recommendation-card.component.html',
  styleUrl: './dual-recommendation-card.component.scss',
})
export class DualRecommendationCardComponent {
  private readonly teamUi = inject(TeamUiService);

  @Input({ required: true })
  card!: DualRecommendationCard;

  @Input({ required: true })
  driverInfoA!: RaceRecommendationDriver;

  @Input({ required: true })
  driverInfoB!: RaceRecommendationDriver;

  selectedRecommendationIndex = 0;

  get recommendation(): RecommendationPair {
    return this.card.recommendations[this.selectedRecommendationIndex];
  }

  get compatibilityScore(): number {
    return this.recommendation.compatibilityScore;
  }

  get driverA() {
    return this.recommendation.lapA;
  }

  get driverB() {
    return this.recommendation.lapB;
  }

  get reasons() {
    return this.recommendation.reasons;
  }

  normalizeColor(color: string): string {
    return this.teamUi.normalizeColor(color);
  }

  formatLapTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);

    const secs = (seconds % 60).toFixed(3).padStart(6, '0');

    return `${minutes}:${secs}`;
  }

  lapDifference(current: number, other: number): string | null {
    if (current <= other) {
      return null;
    }

    return `+${(current - other).toFixed(3)}`;
  }

  get availableDriverALaps(): number[] {
    return [...new Set(this.card.recommendations.map((r) => r.lapA.lapNumber))];
  }

  get availableDriverBLaps(): number[] {
    return [...new Set(this.card.recommendations.map((r) => r.lapB.lapNumber))];
  }

  selectDriverALap(lapNumber: number): void {
    const index = this.card.recommendations.findIndex(
      (r) => r.lapA.lapNumber === lapNumber,
    );

    if (index >= 0) {
      this.selectedRecommendationIndex = index;
    }
  }

  selectDriverBLap(lapNumber: number): void {
    const index = this.card.recommendations.findIndex(
      (r) => r.lapB.lapNumber === lapNumber,
    );

    if (index >= 0) {
      this.selectedRecommendationIndex = index;
    }
  }
}
