import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  DualDriverRecommendationResponse,
  DualRecommendationCard,
  DualRecommendationStint,
  RecommendationPair,
  SingleDriverRecommendationResponse,
} from '../../../models/race-management-recommendation.model';
import { SingleRecommendationCardComponent } from './single-recommendation-card/single-recommendation-card.component';
import { TeamUiService } from '../../../services/team-ui.service';
import { DualRecommendationCardComponent } from './dual-recommendation-card/dual-recommendation-card.component';

@Component({
  selector: 'app-race-management-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    SingleRecommendationCardComponent,
    DualRecommendationCardComponent,
  ],
  templateUrl: './race-management-recommendations.component.html',
  styleUrl: './race-management-recommendations.component.scss',
})
export class RaceManagementRecommendationsComponent implements OnChanges {
  private readonly teamUi = inject(TeamUiService);
  @Input()
  singleRecommendation: SingleDriverRecommendationResponse | null = null;

  @Input()
  dualRecommendation: DualDriverRecommendationResponse | null = null;

  @Input()
  loading = false;

  @ViewChild('cardsContainer')
  cardsContainer!: ElementRef<HTMLDivElement>;

  currentCard = 0;
  selectedStintIndex = 0;

  dualStints: DualRecommendationStint[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dualRecommendation']) {
      this.buildDualRecommendationModel();
    }
  }

  scrollToCard(index: number): void {
    const container = this.cardsContainer.nativeElement;

    container.scrollTo({
      left: index * container.clientWidth,
      behavior: 'smooth',
    });
  }

  onScroll(): void {
    const container = this.cardsContainer.nativeElement;

    this.currentCard = Math.round(container.scrollLeft / container.clientWidth);
  }

  get currentStint() {
    return this.singleRecommendation?.stints[this.selectedStintIndex] ?? null;
  }

  get recommendationLaps() {
    return this.currentStint?.laps ?? [];
  }

  get currentDualStint() {
    return this.dualStints[this.selectedStintIndex] ?? null;
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

  private buildDualRecommendationModel(): void {
    if (!this.dualRecommendation) {
      this.dualStints = [];
      return;
    }

    this.dualStints = this.dualRecommendation.stintComparisons.map((stint) => {
      const cards: DualRecommendationCard[] = [];

      console.log(
        stint.recommendationGroups.map((g) => ({
          secondaryLap: g.secondaryLap,
          laps: g.recommendations.map(
            (r) => `${r.lapA.lapNumber}-${r.lapB.lapNumber}`,
          ),
        })),
      );

      for (const group of stint.recommendationGroups) {
        if (group.recommendations.length === 0) {
          continue;
        }

        cards.push({
          recommendations: group.recommendations,
        });
      }

      return {
        driverAStint: stint.driverAStint,
        driverBStint: stint.driverBStint,

        cards,
      };
    });

    console.log(this.dualStints);
    console.log(this.dualStints[0].cards.length);
  }

  normalizeColor(color: string): string {
    return this.teamUi.normalizeColor(color);
  }

  get isDualRecommendation(): boolean {
    return this.dualRecommendation !== null;
  }
}
