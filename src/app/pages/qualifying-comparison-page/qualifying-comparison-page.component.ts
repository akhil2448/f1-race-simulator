import { Component, OnInit, inject } from '@angular/core';
import { QualifyingComparisonService } from '../../core/services/qualifying-comparison.service';
import { QualifyingComparisonResponse } from '../../core/models/qualifying-comparison.model';
import { ComparisonTrackMapComponent } from '../../comparision/components/comparison-track-map/comparison-track-map.component';
import { TelemetryPanelComponent } from '../../comparision/telemetry-panel/telemetry-panel.component';

@Component({
  selector: 'app-qualifying-comparison-page',
  standalone: true,
  imports: [ComparisonTrackMapComponent, TelemetryPanelComponent],
  templateUrl: './qualifying-comparison-page.component.html',
  styleUrl: './qualifying-comparison-page.component.scss',
})
export class QualifyingComparisonPageComponent implements OnInit {
  private comparisonService = inject(QualifyingComparisonService);

  comparison: QualifyingComparisonResponse | null = null;

  loading = true;

  ngOnInit(): void {
    this.comparisonService
      .getComparison(2021, 8, 'Q3', 'VER', 'HAM')
      .subscribe({
        next: (response) => {
          console.log('Qualifying Comparison', response);

          this.comparison = response;

          this.loading = false;
        },

        error: (error) => {
          console.error(error);

          this.loading = false;
        },
      });
  }
}
