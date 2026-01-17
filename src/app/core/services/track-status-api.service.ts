import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrackStatusApiResponse } from '../models/track-status.model';

@Injectable({
  providedIn: 'root',
})
export class TrackStatusApiService {
  private baseUrl = '/api/track-status';

  constructor(private http: HttpClient) {}

  getTrackStatusData(
    year: number,
    round: number,
  ): Observable<TrackStatusApiResponse> {
    return this.http.get<TrackStatusApiResponse>(
      `${this.baseUrl}/${year}/${round}`,
    );
  }
}
