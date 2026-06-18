import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { firstValueFrom } from 'rxjs';

import {
  QualifyingDriver,
  QualifyingResponse,
  QualifyingService,
} from '../../core/services/qualifying.service';

import { LoadingOverlayService } from '../../core/services/loading-overlay.service';
import { RaceSelectionStateService } from '../../core/services/race-selection-state.service';

@Component({
  selector: 'app-qualifying',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qualifying.component.html',
  styleUrls: ['./qualifying.component.scss'],
})
export class QualifyingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly raceSelectionState = inject(RaceSelectionStateService);

  private readonly qualifyingService = inject(QualifyingService);

  private readonly overlay = inject(LoadingOverlayService);

  private readonly MIN_LOADING_MS = 2500;

  private readonly MAX_RETRIES = 3;

  raceName = '';

  year = 0;

  round = 0;

  q3Drivers: QualifyingDriver[] = [];

  q2Drivers: QualifyingDriver[] = [];

  q1Drivers: QualifyingDriver[] = [];

  leftGridDrivers: QualifyingDriver[] = [];

  rightGridDrivers: QualifyingDriver[] = [];

  pitLaneDrivers: QualifyingDriver[] = [];

  async ngOnInit(): Promise<void> {
    this.year = Number(this.route.snapshot.paramMap.get('year'));
    this.raceSelectionState.selectedYear = this.year;

    this.round = Number(this.route.snapshot.paramMap.get('round'));

    await this.loadQualifying();
  }

  async loadQualifying(): Promise<void> {
    const startTime = Date.now();

    this.overlay.show('Fetching qualifying results...');

    try {
      const response = await this.fetchWithRetry();

      const elapsed = Date.now() - startTime;

      const remaining = Math.max(0, this.MIN_LOADING_MS - elapsed);

      await this.delay(remaining);

      this.processResponse(response);
    } finally {
      this.overlay.hide();
    }
  }

  private async fetchWithRetry(): Promise<QualifyingResponse> {
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        return await firstValueFrom(
          this.qualifyingService.getQualifying(this.year, this.round),
        );
      } catch {
        attempt++;

        if (attempt >= this.MAX_RETRIES) {
          throw new Error('Failed to load qualifying');
        }

        this.overlay.show(
          `Connection issue. Retrying (${attempt}/${this.MAX_RETRIES})...`,
        );

        await this.delay(1000);
      }
    }

    throw new Error();
  }

  private processResponse(response: QualifyingResponse): void {
    this.raceName = response.session.raceName;

    const results = response.qualifyingResults;

    this.q3Drivers = results.filter((d) => d.finalSession === 'Q3');

    this.q2Drivers = results.filter((d) => d.finalSession === 'Q2');

    this.q1Drivers = results.filter((d) => d.finalSession === 'Q1');

    const gridDrivers = results
      .filter((d) => d.gridPosition > 0)
      .sort((a, b) => a.gridPosition - b.gridPosition);

    this.pitLaneDrivers = results.filter((d) => d.gridPosition === 0);

    this.leftGridDrivers = gridDrivers.filter((_, index) => index % 2 === 0);

    this.rightGridDrivers = gridDrivers.filter((_, index) => index % 2 === 1);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getTeamLogo(teamName: string): string {
    let logo = 'plcholder';

    if (teamName === 'McLaren') logo = 'mclaren';
    else if (teamName === 'Mercedes') logo = 'mercedes';
    else if (teamName === 'Sauber' || teamName === 'Alfa Romeo Racing')
      logo = 'alfaromeo';
    else if (teamName === 'Toro Rosso') logo = 'tororosso';
    else if (teamName === 'Haas F1 Team') logo = 'haas';
    else if (teamName === 'Renault') logo = 'renault';
    else if (teamName === 'Force India') logo = 'forceindia';
    else if (teamName === 'Racing Point') logo = 'racingpoint';
    else if (teamName === 'Ferrari') logo = 'ferrari';
    else if (teamName === 'Red Bull Racing') logo = 'redbull';
    else if (teamName === 'Williams') logo = 'williams';
    else if (teamName === 'AlphaTauri') logo = 'alphatauri';
    else if (teamName === 'Alfa Romeo') logo = 'alfaromeo';
    else if (teamName === 'Alpine' || teamName === 'Alpine F1 Team')
      logo = 'alpine';
    else if (teamName === 'Aston Martin') logo = 'astonmartin';
    else if (teamName === 'Kick Sauber') logo = 'kicksauber';
    else if (teamName === 'Audi') logo = 'audi';
    else if (teamName === 'Cadillac') logo = 'cadillac';
    else if (teamName === 'Racing Bulls' || teamName === 'RB')
      logo = 'racingbulls';

    return `assets/team-logos/${logo}.svg`;
  }

  getLogoClass(teamName: string): string {
    return this.getTeamLogo(teamName).split('/').pop()!.replace('.svg', '');
  }

  getTextColor(teamColor: string): string {
    const hex = teamColor.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 120 ? '#000000' : '#ffffff';
  }

  goBack(): void {
    this.router.navigate(['/select-race']);
  }
}
