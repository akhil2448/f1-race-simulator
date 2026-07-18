import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { StartingGridEntry } from '../models/starting-grid.model';

@Injectable({
  providedIn: 'root',
})
export class StartingGridService {
  private readonly http = inject(HttpClient);

  getStartingGrid(
    year: number,
    round: number,
  ): Observable<StartingGridEntry[]> {
    return this.http.get<StartingGridEntry[]>(
      `api/starting-grid/${year}/${round}`,
    );
  }
}
