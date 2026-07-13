import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  DualDriverRecommendationResponse,
  SingleDriverRecommendationResponse,
} from '../../../models/race-management-recommendation.model';
import { RecommendationCardComponent } from './recommendation-card/recommendation-card.component';

@Component({
  selector: 'app-race-management-recommendations',
  standalone: true,
  imports: [CommonModule, RecommendationCardComponent],
  templateUrl: './race-management-recommendations.component.html',
  styleUrl: './race-management-recommendations.component.scss',
})
export class RaceManagementRecommendationsComponent implements AfterViewInit {
  @Input()
  singleRecommendation: SingleDriverRecommendationResponse | null = null;

  @Input()
  dualRecommendation: DualDriverRecommendationResponse | null = null;

  @ViewChild('cardsContainer')
  cardsContainer!: ElementRef<HTMLDivElement>;

  currentCard = 0;
  selectedStintIndex = 0;

  ngAfterViewInit(): void {
    const container = this.cardsContainer.nativeElement;

    container.addEventListener('scroll', () => {
      const width = container.clientWidth;

      this.currentCard = Math.round(container.scrollLeft / (width + 20));
    });
  }

  scrollToCard(index: number): void {
    const container = this.cardsContainer.nativeElement;

    container.scrollTo({
      left: index * (container.clientWidth + 20),
      behavior: 'smooth',
    });
  }

  get currentStint() {
    return this.singleRecommendation?.stints[this.selectedStintIndex] ?? null;
  }

  get recommendationLaps() {
    return this.currentStint?.laps ?? [];
  }

  selectStint(index: number): void {
    this.selectedStintIndex = index;

    this.currentCard = 0;

    if (this.cardsContainer) {
      this.cardsContainer.nativeElement.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    }
  }
}
