import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { RaceAnalyzerResponse } from '../../../models/race-performance-analysis.model';

@Component({
  selector: 'app-race-performance-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-performance-analysis.component.html',
  styleUrl: './race-performance-analysis.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacePerformanceAnalysisComponent {
  @Input({ required: true }) loading = false;

  @Input() analysis: RaceAnalyzerResponse | null = null;
}
