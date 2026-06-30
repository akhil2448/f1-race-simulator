import { Component, OnInit, inject, HostListener } from '@angular/core';
import { RaceContextService } from '../../core/services/race-context.service';
import { QualifyingComparisonResponse } from '../../comparison/models/qualifying-comparison.model';
import { ComparisonTrackMapComponent } from '../../comparison/components/comparison-track-map/comparison-track-map.component';
import { TelemetryPanelComponent } from '../../comparison/components/telemetry-panel/telemetry-panel.component';
import { LapPlaybackService } from '../../comparison/services/lap-playback.service';
import { PlaybackControlsComponent } from '../../comparison/components/playback-controls/playback-controls.component';
import { DriverCardComponent } from '../../comparison/components/driver-card/driver-card.component';
import { SectorDisplay } from '../../comparison/models/sector-display.model';
import { ComparisonThemeService } from '../../comparison/services/comparison-theme.service';
import { ComparisonTheme } from '../../comparison/models/comparison-theme.model';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Router } from '@angular/router';
import { LoadingOverlayService } from '../../core/services/loading-overlay.service';

@Component({
  selector: 'app-qualifying-comparison-page',
  standalone: true,
  imports: [
    ComparisonTrackMapComponent,
    TelemetryPanelComponent,
    PlaybackControlsComponent,
    DriverCardComponent,
    ConfirmationDialogComponent,
  ],
  templateUrl: './qualifying-comparison-page.component.html',
  styleUrl: './qualifying-comparison-page.component.scss',
})
export class QualifyingComparisonPageComponent implements OnInit {
  readonly playbackService = inject(LapPlaybackService);
  private readonly raceContext = inject(RaceContextService);
  private readonly overlay = inject(LoadingOverlayService);
  private readonly router = inject(Router);
  private themeService = inject(ComparisonThemeService);

  comparison: QualifyingComparisonResponse | null = null;
  theme!: ComparisonTheme;

  private readonly MIN_BACK_LOADING_MS = 1000;
  loading = true;
  showExitDialog = false;

  ngOnInit(): void {
    const response = this.raceContext.comparison;

    if (!response) {
      this.redirectToPerformanceLab();
      return;
    }

    this.comparison = response;

    this.theme = this.themeService.buildTheme(
      response.driverA.teamColor,
      response.driverB?.teamColor ?? response.driverA.teamColor,
    );

    const referenceLapTime = Math.min(
      response.driverA.lapTime,
      response.driverB?.lapTime ?? response.driverA.lapTime,
    );

    this.playbackService.loadLap(response.driverA.telemetry, referenceLapTime);

    this.stepForward();

    this.loading = false;

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

  onBackClicked(): void {
    this.showExitDialog = true;
  }

  cancelExit(): void {
    this.showExitDialog = false;
  }

  async confirmExit(): Promise<void> {
    this.showExitDialog = false;

    this.overlay.show('Returning to Performance Lab...');

    const startTime = Date.now();

    try {
      const elapsed = Date.now() - startTime;

      const remaining = Math.max(0, this.MIN_BACK_LOADING_MS - elapsed);

      await this.delay(remaining);

      await this.router.navigate(['/performance-lab']);
    } finally {
      this.overlay.hide();
    }
  }

  private async redirectToPerformanceLab(): Promise<void> {
    this.overlay.show('Returning to Performance Lab...');

    await this.delay(800);

    this.overlay.hide();

    await this.router.navigate(['/performance-lab']);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    event.preventDefault();
    event.returnValue = '';
  }
}
