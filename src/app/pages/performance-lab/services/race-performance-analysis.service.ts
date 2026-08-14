import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { RaceAnalyzerResponse } from '../models/race-performance-analysis.model';

@Injectable({
  providedIn: 'root',
})
export class RacePerformanceAnalysisService {
  private readonly http = inject(HttpClient);

  getSingleDriverAnalysis(
    year: number,
    round: number,
    driver: string,
  ): Observable<RaceAnalyzerResponse> {
    return this.http.get<RaceAnalyzerResponse>(
      `api/race-analyzer/${year}/${round}`,
      {
        params: {
          driverA: driver,
        },
      },
    );
  }

  getDualDriverAnalysis(
    year: number,
    round: number,
    driverA: string,
    driverB: string,
  ): Observable<RaceAnalyzerResponse> {
    return this.http.get<RaceAnalyzerResponse>(
      `api/race-analyzer/${year}/${round}`,
      {
        params: {
          driverA,
          driverB,
        },
      },
    );
  }
}
