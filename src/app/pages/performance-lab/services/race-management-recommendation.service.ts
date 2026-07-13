import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DualDriverRecommendationResponse,
  SingleDriverRecommendationResponse,
} from '../models/race-management-recommendation.model';

@Injectable({
  providedIn: 'root',
})
export class RaceManagementRecommendationService {
  private readonly http = inject(HttpClient);

  getSingleDriverRecommendation(
    year: number,
    round: number,
    driver: string,
  ): Observable<SingleDriverRecommendationResponse> {
    return this.http.get<SingleDriverRecommendationResponse>(
      `api/race-management/${year}/${round}/${driver}`,
    );
  }

  getDualDriverRecommendation(
    year: number,
    round: number,
    driverA: string,
    driverB: string,
  ): Observable<DualDriverRecommendationResponse> {
    return this.http.get<DualDriverRecommendationResponse>(
      `api/race-management/${year}/${round}`,
      {
        params: {
          driverA,
          driverB,
        },
      },
    );
  }
}
