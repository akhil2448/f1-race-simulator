import { Component, OnInit, inject } from '@angular/core';
import { QualifyingComparisonService } from '../../core/services/qualifying-comparison.service';
import { QualifyingComparisonResponse } from '../../core/models/qualifying-comparison.model';
import { ComparisonTrackMapComponent } from '../../comparison/components/comparison-track-map/comparison-track-map.component';
import { TelemetryPanelComponent } from '../../comparison/components/telemetry-panel/telemetry-panel.component';
import { LapPlaybackService } from '../../comparison/services/lap-playback.service';
import { PlaybackControlsComponent } from '../../comparison/components/playback-controls/playback-controls.component';
import { DriverCardComponent } from '../../comparison/components/driver-card/driver-card.component';

@Component({
  selector: 'app-qualifying-comparison-page',
  standalone: true,
  imports: [
    ComparisonTrackMapComponent,
    TelemetryPanelComponent,
    PlaybackControlsComponent,
    DriverCardComponent,
  ],
  templateUrl: './qualifying-comparison-page.component.html',
  styleUrl: './qualifying-comparison-page.component.scss',
})
export class QualifyingComparisonPageComponent implements OnInit {
  private comparisonService = inject(QualifyingComparisonService);
  readonly playbackService = inject(LapPlaybackService);

  comparison: QualifyingComparisonResponse | null = null;

  loading = true;

  ngOnInit(): void {
    this.comparisonService
      .getComparison(2020, 2, 'Q3', 'HAM', 'VER')
      .subscribe({
        next: (response) => {
          console.log('Qualifying Comparison', response);

          this.comparison = response;

          const referenceLapTime = Math.min(
            response.driverA.lapTime,
            response.driverB?.lapTime ?? response.driverA.lapTime,
          );

          console.log('Driver A telemetry:', response.driverA.telemetry.length);
          console.log(
            'Driver B telemetry:',
            response.driverB?.telemetry.length,
          );
          console.log(
            'Track sectors:',
            response.trackMap.sector1.length,
            response.trackMap.sector2.length,
            response.trackMap.sector3.length,
          );

          // initialize playback
          this.playbackService.loadLap(
            response.driverA.telemetry,
            referenceLapTime,
          );

          // Temporary until we fix the start position issue.
          this.stepForward();

          this.loading = false;
        },

        error: (error) => {
          console.error(error);

          this.loading = false;
        },
      });

    this.playbackService.currentFrame$.subscribe((frame) => {
      if (!frame) {
        return;
      }

      console.log(frame);
    });
  }

  stepForward(): void {
    this.playbackService.stepForward();
  }

  stepBackward(): void {
    this.playbackService.stepBackward();
  }

  togglePlay(): void {
    this.playbackService.toggle();
  }
}
