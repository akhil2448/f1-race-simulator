import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewChild,
  inject,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

import { RaceAnalyzerResponse } from '../../../models/race-performance-analysis.model';
import { RacePerformanceChartComponent } from './race-performance-chart/race-performance-chart.component';
import { LapDetailsComponent } from './lap-details/lap-details.component';
import { SelectedLap } from '../../../models/lap-details.model';
import { PinnedSelectionModalComponent } from './pinned-selection-modal/pinned-selection-modal.component';
import { RaceComparisonService } from '../../../../../core/services/race-comparison.service';
import { RaceContextService } from '../../../../../core/services/race-context.service';
import { LoadingOverlayService } from '../../../../../core/services/loading-overlay.service';

@Component({
  selector: 'app-race-performance-analysis',
  standalone: true,
  imports: [
    CommonModule,
    RacePerformanceChartComponent,
    LapDetailsComponent,
    PinnedSelectionModalComponent,
  ],
  templateUrl: './race-performance-analysis.component.html',
  styleUrl: './race-performance-analysis.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacePerformanceAnalysisComponent {
  private readonly raceComparisonService = inject(RaceComparisonService);
  private readonly raceContext = inject(RaceContextService);
  private readonly overlay = inject(LoadingOverlayService);
  private readonly router = inject(Router);

  private readonly MAX_RETRIES = 3;
  private readonly MIN_LOADING_MS = 2000;

  @Input({ required: true }) loading = false;

  @Input() analysis: RaceAnalyzerResponse | null = null;

  @ViewChild(RacePerformanceChartComponent)
  performanceChart?: RacePerformanceChartComponent;

  selectedLaps: SelectedLap[] = [];

  showPinnedSelectionModal = false;

  onLapSelected(selected: SelectedLap): void {
    /*
     * Do not select the same lap twice.
     */
    const selectedIndex = this.selectedLaps.findIndex(
      (lap) =>
        lap.driver.driver === selected.driver.driver &&
        lap.lap.lapNumber === selected.lap.lapNumber,
    );

    if (selectedIndex !== -1) {
      return;
    }

    /*
     * First two selections are always allowed.
     */
    if (this.selectedLaps.length < 2) {
      this.selectedLaps = [...this.selectedLaps, selected];
      return;
    }

    const firstLap = this.selectedLaps[0];
    const secondLap = this.selectedLaps[1];

    /*
     * Both laps are pinned.
     *
     * We cannot make a new selection.
     */
    if (firstLap.pinned && secondLap.pinned) {
      this.performanceChart?.hideTooltip();

      this.showPinnedSelectionModal = true;

      requestAnimationFrame(() => {
        this.performanceChart?.hideTooltip();
      });

      return;
    }

    /*
     * Both laps are unpinned.
     *
     * FIFO behavior:
     *
     * [A, B] + C
     *     ↓
     * [B, C]
     *
     * The oldest selection is removed and the new
     * selection becomes the second lap.
     */
    if (!firstLap.pinned && !secondLap.pinned) {
      this.selectedLaps = [secondLap, selected];
      return;
    }

    /*
     * Only the first lap is pinned.
     *
     * [A(P), B] + C
     *       ↓
     * [A(P), C]
     */
    if (firstLap.pinned) {
      this.selectedLaps = [firstLap, selected];
      return;
    }

    /*
     * Only the second lap is pinned.
     *
     * [A, B(P)] + C
     *       ↓
     * [C, B(P)]
     */
    if (secondLap.pinned) {
      this.selectedLaps = [selected, secondLap];
    }
  }

  // private showPinnedSelectionMessage(): void {
  //   console.warn(
  //     'Both selected laps are pinned. Unpin one lap before selecting another.',
  //   );
  // }

  removeLap(id: string): void {
    this.selectedLaps = this.selectedLaps.filter((lap) => lap.id !== id);
  }

  togglePinned(id: string): void {
    this.selectedLaps = this.selectedLaps.map((lap) =>
      lap.id === id
        ? {
            ...lap,
            pinned: !lap.pinned,
          }
        : lap,
    );
  }

  private async fetchComparisonWithRetry(
    driverA: string,
    lapA: number,
    driverB?: string,
    lapB?: number,
  ) {
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        return await firstValueFrom(
          this.raceComparisonService.getComparison(
            this.raceContext.selectedYear!,
            this.raceContext.selectedRound!,
            driverA,
            lapA,
            driverB,
            lapB,
          ),
        );
      } catch {
        attempt++;

        if (attempt >= this.MAX_RETRIES) {
          throw new Error();
        }

        this.overlay.show(
          `Connection issue. Retrying (${attempt}/${this.MAX_RETRIES})...`,
        );

        await this.delay(1000);
      }
    }

    throw new Error();
  }

  async analyzeSelectedLaps(): Promise<void> {
    if (this.selectedLaps.length === 0) {
      return;
    }

    const firstLap = this.selectedLaps[0];
    const secondLap = this.selectedLaps[1];

    const driverA = firstLap.driver.driver;
    const lapA = firstLap.lap.lapNumber;

    const driverB = secondLap?.driver.driver;
    const lapB = secondLap?.lap.lapNumber;

    this.overlay.show('Loading race comparison...');

    const startTime = Date.now();

    try {
      const response = await this.fetchComparisonWithRetry(
        driverA,
        lapA,
        driverB,
        lapB,
      );

      this.raceContext.comparison = response;

      this.raceContext.navigationStep = 'race-comparison';

      this.raceContext.save();

      await this.router.navigate(['/race-comparison']);

      const elapsed = Date.now() - startTime;

      const remaining = Math.max(0, this.MIN_LOADING_MS - elapsed);

      await this.delay(remaining);
    } catch (error) {
      console.error('Failed to load race comparison:', error);
    } finally {
      this.overlay.hide();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  closePinnedSelectionModal(): void {
    this.showPinnedSelectionModal = false;
  }
}
