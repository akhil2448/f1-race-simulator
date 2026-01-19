import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { TrackData, TrackInfo } from '../models/track-data.model';

@Injectable({
  providedIn: 'root',
})
export class TrackMapService {
  private trackSubject = new BehaviorSubject<TrackData | null>(null);
  trackInfo!: TrackInfo;

  /** Public observable */
  track$ = this.trackSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Load once at race start */
  load(year: number, round: number): Observable<void> {
    return this.http.get<TrackData>(`/api/track-map/${year}/${round}`).pipe(
      tap((data) => this.trackSubject.next(data)),
      map(() => void 0),
    );
  }

  getTrackLength(): number | null {
    return this.trackSubject.value?.trackInfo.trackLength ?? null;
  }
}
