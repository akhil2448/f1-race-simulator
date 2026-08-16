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
    const alreadySelected = this.selectedLaps.some(
      (lap) =>
        lap.driver.driver === selected.driver.driver &&
        lap.lap.lapNumber === selected.lap.lapNumber,
    );

    if (alreadySelected) {
      return;
    }

    if (this.selectedLaps.length < 2) {
      this.selectedLaps = [...this.selectedLaps, selected];
      return;
    }

    this.selectedLaps = [this.selectedLaps[1], selected];
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
