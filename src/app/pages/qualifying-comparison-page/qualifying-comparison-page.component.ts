import { Component, OnInit, inject } from '@angular/core';
import { QualifyingComparisonService } from '../../core/services/qualifying-comparison.service';
import { QualifyingComparisonResponse } from '../../core/models/qualifying-comparison.model';
import { ComparisonTrackMapComponent } from '../../comparison/components/comparison-track-map/comparison-track-map.component';
import { TelemetryPanelComponent } from '../../comparison/components/telemetry-panel/telemetry-panel.component';
import { LapPlaybackService } from '../../comparison/services/lap-playback.service';
import { PlaybackControlsComponent } from '../../comparison/components/playback-controls/playback-controls.component';
import { DriverCardComponent } from '../../comparison/components/driver-card/driver-card.component';
import { SectorDisplay } from '../../comparison/models/sector-display.model';

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

  get driverASector1() {
    return this.getSectorDisplay(1, 'A');
  }

  get driverASector2() {
    return this.getSectorDisplay(2, 'A');
  }

  get driverASector3() {
    return this.getSectorDisplay(3, 'A');
  }

  get driverBSector1() {
    return this.getSectorDisplay(1, 'B');
  }

  get driverBSector2() {
    return this.getSectorDisplay(2, 'B');
  }

  get driverBSector3() {
    return this.getSectorDisplay(3, 'B');
  }

  private getSectorDisplay(
    sector: 1 | 2 | 3,
    driver: 'A' | 'B',
  ): SectorDisplay {
    if (!this.comparison?.driverB) {
      return {
        text: null,
        color: 'white',
      };
    }

    const driverA = this.comparison.driverA;
    const driverB = this.comparison.driverB;

    const elapsedA = this.playbackService.currentProgress * driverA.lapTime;

    const elapsedB = this.playbackService.currentProgress * driverB.lapTime;

    const sectorEndA =
      sector === 1
        ? driverA.sector1
        : sector === 2
          ? driverA.sector1 + driverA.sector2
          : driverA.lapTime;

    const sectorEndB =
      sector === 1
        ? driverB.sector1
        : sector === 2
          ? driverB.sector1 + driverB.sector2
          : driverB.lapTime;

    if (elapsedA < sectorEndA || elapsedB < sectorEndB) {
      return {
        text: null,
        color: 'white',
      };
    }

    const timeA =
      sector === 1
        ? driverA.sector1
        : sector === 2
          ? driverA.sector2
          : driverA.sector3;

    const timeB =
      sector === 1
        ? driverB.sector1
        : sector === 2
          ? driverB.sector2
          : driverB.sector3;

    const myTime = driver === 'A' ? timeA : timeB;
    const otherTime = driver === 'A' ? timeB : timeA;

    const winner = myTime <= otherTime;

    return {
      text: winner ? myTime.toFixed(3) : `+${(myTime - otherTime).toFixed(3)}`,
      color: winner ? '#00d25a' : '#ffd400',
    };
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
