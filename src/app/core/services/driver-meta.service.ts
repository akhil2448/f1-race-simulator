import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DriverApiData } from '../models/race-data.model';
import { TEAM_COLORS } from '../constants/team-data';
import { DriverMeta } from '../models/driver-meta.model';

@Injectable({
  providedIn: 'root',
})
export class DriverMetaService {
  /* ===================================================== */
  /* STATE                                                 */
  /* ===================================================== */

  private metaMap = new Map<string, DriverMeta>();

  private metaSubject = new BehaviorSubject<Map<string, DriverMeta>>(
    this.metaMap,
  );

  meta$ = this.metaSubject.asObservable();

  /* ===================================================== */
  /* INITIALIZATION                                        */
  /* ===================================================== */

  /**
   * Call ONCE after race data is fetched
   */
  initialize(drivers: Record<string, DriverApiData>): void {
    const map = new Map<string, DriverMeta>();

    for (const [driverCode, data] of Object.entries(drivers)) {
      const team = data.team;

      map.set(driverCode, {
        driverCode,
        driverNumber: data.driverNumber,
        team,
        color: TEAM_COLORS[team] ?? '#888888', // safe fallback
      });
    }

    this.metaMap = map;
    this.metaSubject.next(this.metaMap);
  }

  /* ===================================================== */
  /* LOOKUP                                                */
  /* ===================================================== */

  /**
   * Fast synchronous lookup by driver code (ALO, VER, etc.)
   */
  get(driverCode: string): DriverMeta | undefined {
    return this.metaMap.get(driverCode);
  }

  getTeamByDriverCode(driverCode: string): string | undefined {
    const teamName = this.metaMap.get(driverCode)?.team;

    if (teamName === 'McLaren') return 'mclaren';
    else if (teamName === 'Mercedes') return 'mercedes';
    else if (teamName === 'Sauber' || teamName === 'Alfa Romeo Racing')
      return 'alfaromeo';
    else if (teamName === 'Toro Rosso') return 'tororosso';
    else if (teamName === 'Haas F1 Team') return 'haas';
    else if (teamName === 'Renault') return 'renault';
    else if (teamName === 'Force India') return 'forceindia';
    else if (teamName === 'Racing Point') return 'racingpoint';
    else if (teamName === 'Ferrari') return 'ferrari';
    else if (teamName === 'Red Bull Racing') return 'redbull';
    else if (teamName === 'Williams') return 'williams';
    else if (teamName === 'AlphaTauri') return 'alphatauri';
    else if (teamName === 'Alpine') return 'alpine';
    else if (teamName === 'Aston Martin') return 'astonmartin';
    else if (teamName === 'Kick Sauber') return 'kicksauber';
    else if (teamName === 'Racing Bulls' || teamName === 'RB')
      return 'racingbulls';
    else return 'plcholder';
  }
}
