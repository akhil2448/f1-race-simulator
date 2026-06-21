import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { countryCodeMap } from '../../core/constants/country-code-map';

import { LoadingOverlayService } from '../../core/services/loading-overlay.service';
import { RaceSelectionStateService } from '../../core/services/race-selection-state.service';

import { Router } from '@angular/router';
import { SupportButtonComponent } from '../../shared/components/support-button/support-button.component';

export interface RaceSchedule {
  round: number;
  country: string;
  location: string;

  officialName: string;
  raceName: string;

  eventDate: string;

  qualifyingName: string;
  qualifyingDate: string;
  qualifyingDateUtc: string;

  raceSessionName: string;
  raceDate: string;
  raceDateUtc: string;

  qualifyingLocalDisplay: string;
  raceLocalDisplay: string;
}

interface YearScheduleResponse {
  year: number;
  races: RaceSchedule[];
}

@Component({
  selector: 'app-race-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, SupportButtonComponent],
  templateUrl: './race-selection.component.html',
  styleUrls: ['./race-selection.component.scss'],
})
export class RaceSelectionComponent implements OnInit {
  private readonly http = inject(HttpClient);

  years: number[] = [];

  selectedYear = new Date().getFullYear();

  races: RaceSchedule[] = [];

  loading = false;

  error: string | null = null;

  private readonly MIN_LOADING_MS = 2500;

  private readonly MAX_RETRIES = 3;

  private readonly overlay = inject(LoadingOverlayService);
  private readonly state = inject(RaceSelectionStateService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initializeYears();

    this.selectedYear = this.state.selectedYear ?? this.years[0];

    this.state.selectedYear = this.selectedYear;

    this.loadSchedule();
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year >= 2018; year--) {
      this.years.push(year);
    }
  }

  onYearChange(): void {
    this.state.selectedYear = this.selectedYear;

    this.loadSchedule();
  }

  async loadSchedule(): Promise<void> {
    this.error = null;

    this.races = [];

    this.overlay.show('Fetching race schedule...');

    const startTime = Date.now();

    try {
      const response = await this.fetchScheduleWithRetry();

      const elapsed = Date.now() - startTime;

      const remaining = Math.max(0, this.MIN_LOADING_MS - elapsed);

      await this.delay(remaining);

      this.races = response.races;
    } catch {
      this.error = 'Unable to load race schedule. Please try again.';
    } finally {
      this.overlay.hide();
    }
  }

  private async fetchScheduleWithRetry(): Promise<YearScheduleResponse> {
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        return await firstValueFrom(
          this.http.get<YearScheduleResponse>(
            `/api/schedule/${this.selectedYear}`,
          ),
        );
      } catch {
        attempt++;

        if (attempt >= this.MAX_RETRIES) {
          throw new Error();
        }

        this.error = `Connection issue. Retrying (${attempt}/${this.MAX_RETRIES})...`;

        await this.delay(1000);
      }
    }

    throw new Error();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async jumpToQualifyingResults(race: RaceSchedule): Promise<void> {
    this.overlay.show('Fetching qualifying results...');

    await this.delay(1500);

    this.router.navigate(['/qualifying', this.selectedYear, race.round]);
  }

  getFlagUrl(country: string): string {
    const code = countryCodeMap[country];

    return `assets/country-flags/${code}.svg`;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
