import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { countryCodeMap } from '../../core/constants/country-code-map';

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
}

interface YearScheduleResponse {
  year: number;
  races: RaceSchedule[];
}

@Component({
  selector: 'app-race-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  ngOnInit(): void {
    this.initializeYears();

    this.selectedYear = this.years[0];

    this.loadSchedule();
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year >= 2018; year--) {
      this.years.push(year);
    }
  }

  onYearChange(): void {
    this.loadSchedule();
  }

  loadSchedule(): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<YearScheduleResponse>(`/api/schedule/${this.selectedYear}`)
      .subscribe({
        next: (response) => {
          this.races = response.races;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'Unable to load race schedule.';
        },
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

  jumpToQualifyingResults(race: RaceSchedule): void {
    console.log('Navigate to qualifying', this.selectedYear, race.round);

    // next phase
    // this.router.navigate([
    //   '/qualifying',
    //   this.selectedYear,
    //   race.round
    // ]);
  }

  getFlagUrl(country: string): string {
    const code = countryCodeMap[country];

    return `assets/country-flags/${code}.svg`;
  }
}
