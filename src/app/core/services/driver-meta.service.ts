import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DriverApiData } from '../models/race-data.model';
import { TEAM_COLORS } from '../constants/team-data';

export interface DriverMeta {
  team: string;
  color: string;
}

@Injectable({
  providedIn: 'root',
})
export class DriverMetaService {
  private meta = new Map<string, DriverMeta>();

  private metaSubject = new BehaviorSubject<Map<string, DriverMeta>>(this.meta);
  meta$ = this.metaSubject.asObservable();

  initialize(drivers: Record<string, DriverApiData>): void {
    const map = new Map<string, DriverMeta>();

    for (const [driverCode, data] of Object.entries(drivers)) {
      const team = data.Team;
      map.set(driverCode, {
        team,
        color: TEAM_COLORS[team] ?? '#888888', // fallback
      });
    }

    this.meta = map;
    this.metaSubject.next(this.meta);
  }

  get(driver: string): DriverMeta | undefined {
    return this.meta.get(driver);
  }
}
