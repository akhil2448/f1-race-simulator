import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrackData, TrackInfo } from '../models/track-data.model';

@Injectable({
  providedIn: 'root',
})
export class TrackMapService {
  constructor(private http: HttpClient) {}

  /** Load once at race start */
  load(year: number, round: number): Observable<TrackData> {
    return this.http.get<TrackData>(`/api/track-map/${year}/${round}`);
  }
}
