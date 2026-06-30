import { Injectable } from '@angular/core';
import { DriverSelectionResponse } from '../../pages/performance-lab/models/performance-lab.model';

@Injectable({
  providedIn: 'root',
})
export class RaceContextService {
  selectedYear: number | null = null;

  selectedRound: number | null = null;

  selectedRace: string | null = null;

  driverSelection: DriverSelectionResponse | null = null;

  navigationStep:
    | 'home'
    | 'race-selection'
    | 'qualifying'
    | 'simulation'
    | 'performance-lab' = 'home';

  reset(): void {
    this.selectedYear = null;

    this.selectedRound = null;

    this.selectedRace = null;

    this.driverSelection = null;

    this.navigationStep = 'home';
  }
}
