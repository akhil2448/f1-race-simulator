import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { RaceResultsResponse } from '../models/race-results.model';

@Injectable({
  providedIn: 'root',
})
export class RaceResultsService {
  private baseUrl = '/api/race-results';

  constructor(private http: HttpClient) {}

  getRaceResults(year: number, round: number): Observable<RaceResultsResponse> {
    return this.http.get<RaceResultsResponse>(
      `${this.baseUrl}/${year}/${round}`,
    );
  }
}
