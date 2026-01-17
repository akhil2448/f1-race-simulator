import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize, map } from 'rxjs/operators';
import { RaceClockService } from './race-clock-service';

export interface DriverTelemetryPoint {
  t: number;
  rpm: number;
  speed: number;
  gear: number;
  throttle: number;
  brake: boolean;
}

@Injectable()
export class DriverTelemetryBufferService {
  private buffer = new Map<number, DriverTelemetryPoint>();

  private bufferStart = 0;
  private bufferEnd = -1;
  private isFetching = false;

  private readonly WINDOW_SECONDS = 600;
  private readonly PREFETCH_THRESHOLD = 360;

  private validFromSecond = 0;

  private year!: number;
  private round!: number;
  private driver!: string;

  constructor(
    private http: HttpClient,
    private raceClock: RaceClockService,
  ) {}

  /* ===================================================== */
  /* INITIALIZE (CALL ON DRIVER CHANGE)                    */
  /* ===================================================== */

  initialize(
    year: number,
    round: number,
    driver: string,
    requestSecond: number,
  ): Observable<void> {
    this.clear();

    this.year = year;
    this.round = round;
    this.driver = driver;

    const to = requestSecond + this.WINDOW_SECONDS;

    // 🔴 Telemetry NOT valid yet
    this.validFromSecond = Number.MAX_SAFE_INTEGER;

    return this.loadChunk(requestSecond, to).pipe(
      tap(() => {
        // ✅ Telemetry becomes valid ONLY when API finishes
        this.validFromSecond = this.raceClock.getCurrentSecond();
      }),
    );
  }

  /* ===================================================== */
  /* ACCESS                                                */
  /* ===================================================== */

  getSampleAt(currentSecond: number): DriverTelemetryPoint | undefined {
    // ❌ Telemetry not valid yet
    if (currentSecond < this.validFromSecond) {
      return undefined;
    }

    this.maybePrefetch(currentSecond);
    return this.buffer.get(Math.floor(currentSecond * 10));
  }

  /* ===================================================== */
  /* PREFETCH                                              */
  /* ===================================================== */

  private maybePrefetch(currentSecond: number): void {
    if (this.isFetching) return;

    const remaining = this.bufferEnd - currentSecond;
    if (remaining <= this.PREFETCH_THRESHOLD) {
      const nextFrom = this.bufferEnd + 1;
      const nextTo = nextFrom + this.WINDOW_SECONDS;
      this.loadChunk(nextFrom, nextTo).subscribe();
    }
  }

  /* ===================================================== */
  /* NETWORK                                               */
  /* ===================================================== */

  private loadChunk(from: number, to: number): Observable<void> {
    this.isFetching = true;

    const url =
      `/api/driver-telemetry/${this.year}/${this.round}/${this.driver}` +
      `?from_second=${from}&to_second=${to}`;

    return this.http.get<any>(url).pipe(
      tap((res) => {
        res.telemetry.forEach((p: DriverTelemetryPoint) => {
          const key = Math.floor(p.t * 10); // 100ms resolution
          this.buffer.set(key, p);
        });

        this.bufferEnd = Math.max(this.bufferEnd, to);
      }),
      finalize(() => (this.isFetching = false)),
      map(() => void 0),
    );
  }

  /* ===================================================== */
  /* RESET                                                 */
  /* ===================================================== */

  clear(): void {
    this.buffer.clear();
    this.bufferStart = 0;
    this.bufferEnd = -1;
    this.isFetching = false;
  }
}
