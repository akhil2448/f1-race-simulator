import { Component, OnInit } from '@angular/core';
import { DriverMetaService } from '../../core/services/driver-meta.service';
import { SimulationBootstrapService } from '../../core/services/simulation-bootstrap.service';
import { RaceFinishService } from '../../core/services/race-finish.service';
import { LeaderboardComponent } from '../../simulation/components/leaderboard/leaderboard.component';
import { WeatherComponent } from '../../simulation/components/weather/weather.component';
import { DriverTelemetryComponent } from '../../simulation/components/driver-telemetry/driver-telemetry.component';
import { RaceClockComponent } from '../../simulation/components/race-clock/race-clock.component';
import { TrackMapComponent } from '../../simulation/components/track-map/track-map.component';
import { TrackMapHeaderComponent } from '../../simulation/components/track-map-header/track-map-header.component';
import { RaceControlsComponent } from '../../simulation/components/race-controls/race-controls.component';
import { RaceControlMessagesComponent } from '../../simulation/components/race-control-messages/race-control-messages.component';
import { FastestLapBannerComponent } from '../../simulation/components/fastest-lap-banner/fastest-lap-banner.component';
import { FinalClassificationComponent } from '../../simulation/components/final-classification/final-classification.component';
import { CommonModule } from '@angular/common';

import {
  RaceApiResponse,
  RedFlagMetadata,
} from '../../core/models/race-data.model';
import { RaceClockService } from '../../core/services/race-clock-service';
import { RedFlagResumeComponent } from '../../simulation/components/red-flag-resume/red-flag-resume.component';
import { LoadingOverlayComponent } from '../../simulation/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    CommonModule,
    LeaderboardComponent,
    WeatherComponent,
    DriverTelemetryComponent,
    RaceClockComponent,
    TrackMapComponent,
    TrackMapHeaderComponent,
    RaceControlsComponent,
    RaceControlMessagesComponent,
    FastestLapBannerComponent,
    FinalClassificationComponent,
    RedFlagResumeComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.scss',
})
export class SimulationComponent implements OnInit {
  availableDrivers: string[] = [];
  selectedDrivers: (string | null)[] = [null, null];

  // Change these values to change the race
  currentYear = 2020;
  currentRound = 5;

  showReplayResumeMessage = false;

  raceFinished = false;

  activeRedFlag: RedFlagMetadata | null = null;

  private raceData: RaceApiResponse | null = null;

  constructor(
    private bootstrap: SimulationBootstrapService,
    private driverMetaService: DriverMetaService,
    private raceFinish: RaceFinishService,
    private raceClock: RaceClockService,
  ) {}

  ngOnInit(): void {
    // this.bootstrap.startRace({
    //   year: this.currentYear,
    //   round: this.currentRound,
    // });

    this.bootstrap.steps$.subscribe((steps) => {
      console.log('BOOTSTRAP STEPS');
      console.table(steps);
    });

    this.raceClock.raceTime$.subscribe((raceSecond) => {
      this.updateActiveRedFlag(raceSecond);
    });

    this.bootstrap.availableDrivers$.subscribe((drivers) => {
      this.availableDrivers = drivers;
    });

    this.bootstrap.raceData$.subscribe((raceData) => {
      this.raceData = raceData;
    });

    window.addEventListener('replay-seek-complete', () => {
      this.showReplayResumeMessage = true;
    });

    window.addEventListener('replay-resumed', () => {
      this.showReplayResumeMessage = false;
    });

    //  REMOVED THIS TO WORK ON TEMPLATING THE FINAL CLASSIFACTION
    this.raceFinish.raceFinished$.subscribe((finished: boolean) => {
      this.raceFinished = finished;
    });

    // setTimeout(() => {
    //   this.raceFinished = true;
    // }, 3000);
  }

  private updateActiveRedFlag(raceSecond: number): void {
    if (!this.raceData) {
      this.activeRedFlag = null;
      return;
    }

    const redFlags = this.raceData.raceControl?.redFlags ?? [];

    const active = redFlags.find((rf) => {
      return (
        raceSecond >= rf.redFlagRaceSecond &&
        raceSecond < rf.restart.resumeRaceSecond
      );
    });

    this.activeRedFlag = active ?? null;
  }

  getAvailableDriversForSlot(slot: number): string[] {
    const other = this.selectedDrivers[slot === 0 ? 1 : 0];
    return this.availableDrivers.filter((d) => d !== other);
  }

  onDriverSelected(slot: number, driver: string): void {
    this.selectedDrivers[slot] = driver;
  }

  getDriverColor(driver: string | null): string | null {
    if (!driver) return null;
    return this.driverMetaService.get(driver)?.color ?? null;
  }

  onDriverCleared(slot: number): void {
    this.selectedDrivers[slot] = null;
  }
}
