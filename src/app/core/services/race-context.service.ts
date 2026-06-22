import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RaceContextService {
  selectedYear: number | null = null;

  selectedRound: number | null = null;

  navigationStep: 'home' | 'race-selection' | 'qualifying' | 'simulation' =
    'home';

  reset(): void {
    this.selectedYear = null;
    this.selectedRound = null;
    this.navigationStep = 'home';
  }
}
