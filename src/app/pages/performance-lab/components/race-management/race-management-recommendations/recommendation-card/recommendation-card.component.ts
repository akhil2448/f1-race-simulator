import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SingleDriverRecommendation } from '../../../../models/race-management-recommendation.model';

@Component({
  selector: 'app-recommendation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recommendation-card.component.html',
  styleUrl: './recommendation-card.component.scss',
})
export class RecommendationCardComponent {
  @Input({ required: true })
  driverCode!: string;

  @Input({ required: true })
  teamColor!: string;

  @Input({ required: true })
  lap!: SingleDriverRecommendation;

  formatLapTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);

    const remaining = (seconds % 60).toFixed(3).padStart(6, '0');

    return `${minutes}:${remaining}`;
  }
}
