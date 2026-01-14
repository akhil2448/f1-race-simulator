import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { TelemetryFrame } from '../models/race-telemetry.model';

@Injectable({
  providedIn: 'root',
})
export class TelemetryBufferService {
  private frameBuffer = new Map<number, TelemetryFrame>();

  constructor(private http: HttpClient) {}

  /** Fetch chunk from backend */
  loadChunk(
    year: number,
    round: number,
    from: number,
    to: number
  ): Observable<void> {
    const url = `/api/telemetry/${year}/${round}?from_second=${from}&to_second=${to}`;

    return this.http.get<any>(url).pipe(
      tap((res) => {
        Object.entries(res.frames).forEach(([sec, frame]) => {
          this.frameBuffer.set(Number(sec), frame as TelemetryFrame);
        });
      }),
      map(() => void 0)
    );
  }

  /** Fast access for race clock */
  getFrame(second: number): TelemetryFrame | undefined {
    return this.frameBuffer.get(second);
  }

  /** Check if data exists (used later for prefetching) */
  hasFrame(second: number): boolean {
    return this.frameBuffer.has(second);
  }

  clear() {
    this.frameBuffer.clear();
  }
}
