import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { RaceManagementDriversResponse } from '../models/performance-lab.model';

@Injectable({
  providedIn: 'root',
})
export class RaceManagementService {
  private readonly http = inject(HttpClient);

  getDrivers(
    year: number,
    round: number,
  ): Observable<RaceManagementDriversResponse> {
    return this.http.get<RaceManagementDriversResponse>(
      `api/race-management/${year}/${round}/drivers`,
    );
  }
}
