import { Injectable } from '@angular/core';
import { RaceApiResponse } from '../models/race-data.model';
import { SectorAnchor } from '../models/sector-anchor.model';

@Injectable({ providedIn: 'root' })
export class SectorAnchorService {
  /** driver -> ordered sector anchors */
  private anchors = new Map<string, SectorAnchor[]>();

  initialize(raceData: RaceApiResponse): void {
    this.anchors.clear();

    for (const [driver, data] of Object.entries(raceData.drivers)) {
      const list: SectorAnchor[] = [];

      data.timing.laps.forEach((lap) => {
        const lapStart = lap.lapStartTime;
        if (lapStart == null) return;

        const times = lap.sectorTimes;
        if (!times || times.length !== 3) return;

        let cumulative = 0;

        // Sector 1
        if (times[0] != null) {
          cumulative += times[0];
          list.push({
            driver,
            lap: lap.lapNumber, // ✅ FIXED
            sector: 1,
            raceTime: lapStart + cumulative,
            sectorTime: times[0],
          });
        }

        // Sector 2
        if (times[1] != null) {
          cumulative += times[1];
          list.push({
            driver,
            lap: lap.lapNumber, // ✅ FIXED
            sector: 2,
            raceTime: lapStart + cumulative,
            sectorTime: times[1],
          });
        }

        // Sector 3
        if (times[2] != null) {
          cumulative += times[2];
          list.push({
            driver,
            lap: lap.lapNumber, // ✅ FIXED
            sector: 3,
            raceTime: lapStart + cumulative,
            sectorTime: times[2],
          });
        }
      });

      this.anchors.set(driver, list);
    }
  }

  /** Last confirmed sector completed before raceTime */
  getLastAnchor(driver: string, raceTime: number): SectorAnchor | undefined {
    const list = this.anchors.get(driver);
    if (!list || !list.length) return undefined;

    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].raceTime <= raceTime) {
        return list[i];
      }
    }

    return undefined;
  }

  hasAnchors(): boolean {
    return this.anchors.size > 0;
  }

  getDriverCount(): number {
    return this.anchors.size;
  }
}
