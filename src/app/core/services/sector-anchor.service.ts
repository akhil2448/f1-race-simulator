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

        let cumulative = 0;

        // IMPORTANT: sectors must be processed in order 1 → 3
        const sectors = lap.sectors;
        if (!sectors || !sectors.length) return;

        // IMPORTANT: sectors must be processed in order 1 → 3
        sectors
          .slice() // avoid mutating original
          .sort((a, b) => a.sector - b.sector)
          .forEach((sector) => {
            cumulative += sector.time;

            list.push({
              driver,
              lap: lap.lapNumber,
              sector: sector.sector,
              raceTime: lapStart + cumulative,
              sectorTime: sector.time,
            });
          });
      });

      this.anchors.set(driver, list);
    }
  }

  /** Last confirmed sector completed before raceTime */
  getLastAnchor(driver: string, raceTime: number): SectorAnchor | undefined {
    const list = this.anchors.get(driver);
    if (!list || !list.length) return undefined;

    // anchors are already ordered
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].raceTime <= raceTime) {
        return list[i];
      }
    }

    return undefined;
  }

  // sector-anchor.service.ts
  hasAnchors(): boolean {
    return this.anchors.size > 0;
  }

  getDriverCount(): number {
    return this.anchors.size;
  }
}
