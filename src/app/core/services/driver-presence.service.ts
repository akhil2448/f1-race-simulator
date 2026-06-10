import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TelemetryFrame } from '../models/race-telemetry.model';

@Injectable({
  providedIn: 'root',
})
export class DriverPresenceService {
  /**
   * FIA-classified OUT drivers
   */
  private officiallyOutDrivers = new Set<string>();

  /**
   * Last telemetry timestamp seen per driver
   */
  private lastSeenTime = new Map<string, number>();

  /**
   * Confirmed OUT drivers
   */
  private outDriversSubject = new BehaviorSubject<Set<string>>(new Set());

  outDrivers$ = this.outDriversSubject.asObservable();

  /**
   * Seconds before telemetry considered dead
   */
  private readonly OUT_TIMEOUT_SECONDS = 8;

  /* =====================================================
     FIA RESULTS
     ===================================================== */

  setOfficiallyOutDrivers(drivers: string[]): void {
    this.officiallyOutDrivers = new Set(drivers);
  }

  /* =====================================================
     TELEMETRY UPDATE
     ===================================================== */

  update(frame: TelemetryFrame): void {
    const raceTime = frame.raceTime;

    /**
     * Refresh last-seen timestamps
     */
    frame.cars.forEach((car) => {
      this.lastSeenTime.set(car.driver, raceTime);
    });

    const out = new Set(this.outDriversSubject.value);

    /**
     * Confirm OUT only if:
     * - FIA says OUT
     * - telemetry stale
     */
    this.officiallyOutDrivers.forEach((driver) => {
      const lastSeen = this.lastSeenTime.get(driver);

      if (lastSeen == null) {
        return;
      }

      const staleFor = raceTime - lastSeen;

      if (staleFor >= this.OUT_TIMEOUT_SECONDS) {
        out.add(driver);
      }
    });

    this.outDriversSubject.next(out);
  }

  /* =====================================================
     ACCESSORS
     ===================================================== */

  isOut(driver: string): boolean {
    return this.outDriversSubject.value.has(driver);
  }
}
