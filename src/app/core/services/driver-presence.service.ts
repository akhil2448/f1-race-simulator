import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TelemetryFrame } from '../models/race-telemetry.model';

@Injectable({ providedIn: 'root' })
export class DriverPresenceService {
  private activeDriversSubject = new BehaviorSubject<Set<string>>(new Set());
  activeDrivers$ = this.activeDriversSubject.asObservable();

  private outDriversSubject = new BehaviorSubject<Set<string>>(new Set());
  outDrivers$ = this.outDriversSubject.asObservable();

  /** Call once per telemetry frame */
  update(frame: TelemetryFrame): void {
    const present = new Set(frame.cars.map((c) => c.driver));
    const previous = this.activeDriversSubject.value;

    // Drivers that disappeared are OUT
    const out = new Set(this.outDriversSubject.value);
    previous.forEach((d) => {
      if (!present.has(d)) out.add(d);
    });

    this.activeDriversSubject.next(present);
    this.outDriversSubject.next(out);
  }

  isOut(driver: string): boolean {
    return this.outDriversSubject.value.has(driver);
  }
}
