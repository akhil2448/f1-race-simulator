import { Injectable } from '@angular/core';
import {
  DriverSelectionDriver,
  DriverSelectionResponse,
} from '../../pages/performance-lab/models/performance-lab.model';
import { QualifyingComparisonResponse } from '../../comparison/models/qualifying-comparison.model';

@Injectable({
  providedIn: 'root',
})
export class RaceContextService {
  private readonly STORAGE_KEY = 'pitwall-race-context';

  constructor() {
    this.restore();
  }

  selectedYear: number | null = null;

  selectedRound: number | null = null;

  selectedRace: string | null = null;

  driverSelection: DriverSelectionResponse | null = null;

  comparison: QualifyingComparisonResponse | null = null;

  selectedSession: 'Q1' | 'Q2' | 'Q3' = 'Q3';

  selectedDrivers: DriverSelectionDriver[] = [];

  navigationStep:
    | 'home'
    | 'race-selection'
    | 'qualifying'
    | 'simulation'
    | 'performance-lab' = 'home';

  save(): void {
    sessionStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({
        selectedYear: this.selectedYear,
        selectedRound: this.selectedRound,
        selectedRace: this.selectedRace,
        driverSelection: this.driverSelection,
        comparison: this.comparison,
        selectedSession: this.selectedSession,
        selectedDrivers: this.selectedDrivers,
        navigationStep: this.navigationStep,
      }),
    );
  }

  private restore(): void {
    const json = sessionStorage.getItem(this.STORAGE_KEY);

    if (!json) {
      return;
    }

    const data = JSON.parse(json);

    this.selectedYear = data.selectedYear;
    this.selectedRound = data.selectedRound;
    this.selectedRace = data.selectedRace;
    this.driverSelection = data.driverSelection;
    this.comparison = data.comparison;
    this.selectedSession = data.selectedSession ?? 'Q3';
    this.selectedDrivers = data.selectedDrivers ?? [];
    this.navigationStep = data.navigationStep;
  }

  reset(): void {
    this.selectedYear = null;

    this.selectedRound = null;

    this.selectedRace = null;

    this.driverSelection = null;

    this.selectedSession = 'Q3';

    this.selectedDrivers = [];

    this.navigationStep = 'home';

    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
