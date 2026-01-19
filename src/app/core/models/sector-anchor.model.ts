export interface SectorAnchor {
  driver: string;
  lap: number;
  sector: 1 | 2 | 3;

  /** Absolute race second when this sector completed */
  raceTime: number;

  /** Sector duration in seconds */
  sectorTime: number;
}
