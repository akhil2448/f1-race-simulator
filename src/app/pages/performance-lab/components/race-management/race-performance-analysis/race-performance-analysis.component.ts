import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { RaceAnalyzerResponse } from '../../../models/race-performance-analysis.model';
import { RacePerformanceChartComponent } from './race-performance-chart/race-performance-chart.component';
import { LapDetailsComponent } from './lap-details/lap-details.component';
import { SelectedLap } from '../../../models/lap-details.model';

@Component({
  selector: 'app-race-performance-analysis',
  standalone: true,
  imports: [CommonModule, RacePerformanceChartComponent, LapDetailsComponent],
  templateUrl: './race-performance-analysis.component.html',
  styleUrl: './race-performance-analysis.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacePerformanceAnalysisComponent {
  @Input({ required: true }) loading = false;

  @Input() analysis: RaceAnalyzerResponse | null = null;

  selectedLaps: SelectedLap[] = [];

  onLapSelected(selected: SelectedLap): void {
    /*
     * Do not select the same lap twice.
     */
    const alreadySelected = this.selectedLaps.some(
      (lap) =>
        lap.driver.driver === selected.driver.driver &&
        lap.lap.lapNumber === selected.lap.lapNumber,
    );

    if (alreadySelected) {
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
      this.showPinnedSelectionMessage();
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

  private showPinnedSelectionMessage(): void {
    console.warn(
      'Both selected laps are pinned. Unpin one lap before selecting another.',
    );
  }

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
}
