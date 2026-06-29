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

  get driverASector1Text(): string | null {
    if (!this.comparison?.driverB) {
      return null;
    }

    const progress = this.playbackService.currentProgress;

    const elapsedA = progress * this.comparison.driverA.lapTime;
    const elapsedB = progress * this.comparison.driverB.lapTime;

    //
    // Wait until BOTH drivers finish Sector 1.
    //
    if (
      elapsedA < this.comparison.driverA.sector1 ||
      elapsedB < this.comparison.driverB.sector1
    ) {
      return null;
    }

    if (this.comparison.driverA.sector1 <= this.comparison.driverB.sector1) {
      return this.comparison.driverA.sector1.toFixed(3);
    }

    return `+${(
      this.comparison.driverA.sector1 - this.comparison.driverB.sector1
    ).toFixed(3)}`;
  }

  get driverASector2Text(): string | null {
    if (!this.comparison?.driverB) {
      return null;
    }

    const progress = this.playbackService.currentProgress;

    const elapsedA = progress * this.comparison.driverA.lapTime;
    const elapsedB = progress * this.comparison.driverB.lapTime;

    const sector2EndA =
      this.comparison.driverA.sector1 + this.comparison.driverA.sector2;

    const sector2EndB =
      this.comparison.driverB.sector1 + this.comparison.driverB.sector2;

    //
    // Wait until BOTH drivers finish Sector 2.
    //
    if (elapsedA < sector2EndA || elapsedB < sector2EndB) {
      return null;
    }

    if (this.comparison.driverA.sector2 <= this.comparison.driverB.sector2) {
      return this.comparison.driverA.sector2.toFixed(3);
    }

    return `+${(
      this.comparison.driverA.sector2 - this.comparison.driverB.sector2
    ).toFixed(3)}`;
  }

  get driverASector3Text(): string | null {
    if (!this.comparison?.driverB) {
      return null;
    }

    const progress = this.playbackService.currentProgress;

    const elapsedA = progress * this.comparison.driverA.lapTime;
    const elapsedB = progress * this.comparison.driverB.lapTime;

    //
    // Wait until BOTH drivers finish the lap.
    //
    if (
      elapsedA < this.comparison.driverA.lapTime ||
      elapsedB < this.comparison.driverB.lapTime
    ) {
      return null;
    }

    if (this.comparison.driverA.sector3 <= this.comparison.driverB.sector3) {
      return this.comparison.driverA.sector3.toFixed(3);
    }

    return `+${(
      this.comparison.driverA.sector3 - this.comparison.driverB.sector3
    ).toFixed(3)}`;
  }

  get driverBSector1Text(): string | null {
    if (!this.comparison?.driverB) {
      return null;
    }

    const progress = this.playbackService.currentProgress;

    const elapsedA = progress * this.comparison.driverA.lapTime;
    const elapsedB = progress * this.comparison.driverB.lapTime;

    if (
      elapsedA < this.comparison.driverA.sector1 ||
      elapsedB < this.comparison.driverB.sector1
    ) {
      return null;
    }

    if (this.comparison.driverB.sector1 <= this.comparison.driverA.sector1) {
      return this.comparison.driverB.sector1.toFixed(3);
    }

    return `+${(
      this.comparison.driverB.sector1 - this.comparison.driverA.sector1
    ).toFixed(3)}`;
  }

  get driverBSector2Text(): string | null {
    if (!this.comparison?.driverB) {
      return null;
    }

    const progress = this.playbackService.currentProgress;

    const elapsedA = progress * this.comparison.driverA.lapTime;
    const elapsedB = progress * this.comparison.driverB.lapTime;

    const sector2EndA =
      this.comparison.driverA.sector1 + this.comparison.driverA.sector2;

    const sector2EndB =
      this.comparison.driverB.sector1 + this.comparison.driverB.sector2;

    if (elapsedA < sector2EndA || elapsedB < sector2EndB) {
      return null;
    }

    if (this.comparison.driverB.sector2 <= this.comparison.driverA.sector2) {
      return this.comparison.driverB.sector2.toFixed(3);
    }

    return `+${(
      this.comparison.driverB.sector2 - this.comparison.driverA.sector2
    ).toFixed(3)}`;
  }

  get driverBSector3Text(): string | null {
    if (!this.comparison?.driverB) {
      return null;
    }

    const progress = this.playbackService.currentProgress;

    const elapsedA = progress * this.comparison.driverA.lapTime;
    const elapsedB = progress * this.comparison.driverB.lapTime;

    if (
      elapsedA < this.comparison.driverA.lapTime ||
      elapsedB < this.comparison.driverB.lapTime
    ) {
      return null;
    }

    if (this.comparison.driverB.sector3 <= this.comparison.driverA.sector3) {
      return this.comparison.driverB.sector3.toFixed(3);
    }

    return `+${(
      this.comparison.driverB.sector3 - this.comparison.driverA.sector3
    ).toFixed(3)}`;
  }

  stepForward(): void {
    this.playbackService.stepForward();
  }

  stepBackward(): void {
    this.playbackService.stepBackward();
  }

  get driverAElapsedTime(): number {
    if (!this.comparison) {
      return 0;
    }

    return (
      this.playbackService.currentProgress * this.comparison.driverA.lapTime
    );
  }

  get driverBElapsedTime(): number {
    if (!this.comparison?.driverB) {
      return 0;
    }

    return (
      this.playbackService.currentProgress * this.comparison.driverB.lapTime
    );
  }

  get driverAGap(): number | null {
    if (!this.comparison?.driverB) {
      return null;
    }

    const gap = this.driverAElapsedTime - this.driverBElapsedTime;

    //
    // Leading driver shows no gap.
    //
    return gap > 0 ? gap : null;
  }

  get driverBGap(): number | null {
    if (!this.comparison?.driverB) {
      return null;
    }

    const gap = this.driverBElapsedTime - this.driverAElapsedTime;

    return gap > 0 ? gap : null;
  }

  togglePlay(): void {
    this.playbackService.toggle();
  }
}
