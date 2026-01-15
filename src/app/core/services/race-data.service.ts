import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RaceApiResponse } from '../models/race-data.model';

@Injectable({
  providedIn: 'root',
})
export class RaceDataService {
  private baseUrl = '/api/race';

  constructor(private http: HttpClient) {}

  getRaceData(year: number, round: number): Observable<RaceApiResponse> {
    return this.http.get<RaceApiResponse>(`${this.baseUrl}/${year}/${round}`);
  }
}
