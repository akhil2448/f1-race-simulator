import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TyreLifeService {
  private tyreLifeMap = new Map<string, Map<number, number>>();

  initialize(drivers: Record<string, any>): void {
    this.tyreLifeMap.clear();

    for (const [driverCode, data] of Object.entries(drivers)) {
      const lapMap = new Map<number, number>();

      data.laps?.forEach((lap: any) => {
        lapMap.set(lap.LapNumber, lap.TyreLife);
      });

      this.tyreLifeMap.set(driverCode, lapMap);
    }
  }

  getTyreLife(driverCode: string, lap: number): number | undefined {
    return this.tyreLifeMap.get(driverCode)?.get(lap);
  }
}
