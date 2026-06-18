import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RaceSelectionStateService {
  selectedYear: number | null = null;
}
