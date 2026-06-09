import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { TrackData, TrackInfo, TrackPoint } from '../models/track-data.model';

@Injectable({
  providedIn: 'root',
})
export class TrackMapStateService {
  /* ===================================================== */
  /* RAW TRACK DATA                                        */
  /* ===================================================== */

  private trackDataSubject = new BehaviorSubject<TrackData | null>(null);

  trackData$ = this.trackDataSubject.asObservable();

  /* ===================================================== */
  /* MIRROR STATE                                          */
  /* ===================================================== */

  private mirroredSubject = new BehaviorSubject<boolean>(false);

  mirrored$ = this.mirroredSubject.asObservable();

  /* ===================================================== */
  /* SETTERS                                               */
  /* ===================================================== */

  setTrackData(data: TrackData): void {
    this.trackDataSubject.next(data);
  }

  toggleMirror(): void {
    this.mirroredSubject.next(!this.mirroredSubject.value);
  }

  /* ===================================================== */
  /* GETTERS                                               */
  /* ===================================================== */

  get trackInfo(): TrackInfo | null {
    return this.trackDataSubject.value?.trackInfo ?? null;
  }

  get track(): TrackPoint[] {
    return this.trackDataSubject.value?.coordinates ?? [];
  }

  get isMirrored(): boolean {
    return this.mirroredSubject.value;
  }
}
