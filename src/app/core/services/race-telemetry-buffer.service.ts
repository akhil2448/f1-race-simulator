import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, finalize } from 'rxjs/operators';
import { TelemetryFrame } from '../models/race-telemetry.model';

@Injectable({
  providedIn: 'root',
})
export class TelemetryBufferService {
  private frameBuffer = new Map<number, TelemetryFrame>();

  private bufferStart = 0;
  private bufferEnd = -1;

  private isFetching = false;

  // 🔒 Tunable constants
  private readonly WINDOW_SECONDS = 600; // 10 minutes
  private readonly PREFETCH_THRESHOLD = 360; // 6 minutes

  private year!: number;
  private round!: number;
  currentFrom: number | undefined;
  currentTo: number | undefined;

  constructor(private http: HttpClient) {}

  /* ---------------------------------------------------- */
  /* INITIAL LOAD                                         */
  /* ---------------------------------------------------- */

  initialize(year: number, round: number): Observable<void> {
    this.clear();
    this.year = year;
    this.round = round;

    this.currentFrom = 0;
    this.currentTo = 600; // initial 10 minutes

    return this.loadChunkInternal(this.currentFrom, this.currentTo);
  }

  /* ---------------------------------------------------- */
  /* FRAME ACCESS (CALLED BY SIMULATION ENGINE)            */
  /* ---------------------------------------------------- */

  getFrame(second: number): TelemetryFrame | undefined {
    this.maybePrefetch(second);
    return this.frameBuffer.get(second);
  }

  hasFrame(second: number): boolean {
    return this.frameBuffer.has(second);
  }

  /* ---------------------------------------------------- */
  /* PREFETCH LOGIC                                       */
  /* ---------------------------------------------------- */

  private maybePrefetch(currentSecond: number): void {
    if (this.isFetching) return;

    const secondsRemaining = this.bufferEnd - currentSecond;

    if (secondsRemaining <= this.PREFETCH_THRESHOLD) {
      const nextFrom = this.bufferEnd + 1;
      const nextTo = nextFrom + this.WINDOW_SECONDS;

      this.loadChunkInternal(nextFrom, nextTo).subscribe();
    }
  }

  /* ---------------------------------------------------- */
  /* NETWORK                                              */
  /* ---------------------------------------------------- */

  private loadChunkInternal(from: number, to: number): Observable<void> {
    this.isFetching = true;

    const url = `/api/telemetry/${this.year}/${this.round}?from_second=${from}&to_second=${to}`;

    return this.http.get<any>(url).pipe(
      tap((res) => {
        Object.entries(res.frames).forEach(([sec, frame]) => {
          this.frameBuffer.set(Number(sec), frame as TelemetryFrame);
        });

        this.bufferStart = this.bufferEnd === -1 ? from : this.bufferStart;
        this.bufferEnd = Math.max(this.bufferEnd, to);
      }),
      finalize(() => {
        this.isFetching = false;
      }),
      map(() => void 0)
    );
  }

  /* ---------------------------------------------------- */
  /* RESET                                                */
  /* ---------------------------------------------------- */

  clear(): void {
    this.frameBuffer.clear();
    this.bufferStart = 0;
    this.bufferEnd = -1;
    this.isFetching = false;
  }
}
