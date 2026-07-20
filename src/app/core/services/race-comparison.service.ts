import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { RaceComparisonResponse } from '../../comparison/models/race-comparison.model';

@Injectable({
  providedIn: 'root',
})
export class RaceComparisonService {
  private http = inject(HttpClient);

  getComparison(
    year: number,
    round: number,
    driverA: string,
    lapA: number,
    driverB?: string,
    lapB?: number,
  ): Observable<RaceComparisonResponse> {
    let params = new HttpParams()
      .set('driverA', driverA)
      .set('lapA', lapA.toString());

    if (driverB && lapB !== undefined) {
      params = params.set('driverB', driverB).set('lapB', lapB.toString());
    }

    return this.http.get<RaceComparisonResponse>(
      `/api/race-comparison/${year}/${round}`,
      {
        params,
      },
    );
  }
}
