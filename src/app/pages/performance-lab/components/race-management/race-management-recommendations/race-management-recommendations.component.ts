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

@Component({
  selector: 'app-race-management-recommendations',
  standalone: true,
  imports: [CommonModule],
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

  get cards(): number[] {
    return [1, 2, 3, 4];
  }
}
