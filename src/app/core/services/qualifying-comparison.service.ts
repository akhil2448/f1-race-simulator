import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { QualifyingComparisonResponse } from '../../comparison/models/qualifying-comparison.model';

@Injectable({
  providedIn: 'root',
})
export class QualifyingComparisonService {
  private http = inject(HttpClient);

  getComparison(
    year: number,
    round: number,
    sessionPart: string,
    driverA: string,
    driverB: string,
  ): Observable<QualifyingComparisonResponse> {
    return this.http.get<QualifyingComparisonResponse>(
      `/api/qualifying-comparison/${year}/${round}/${sessionPart}`,
      {
        params: {
          driverA,
          driverB,
        },
      },
    );
  }
}
