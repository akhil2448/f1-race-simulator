/* -------------------- ROOT API RESPONSE -------------------- */

export interface RaceApiResponse {
  session: RaceSession;
  drivers: Record<string, DriverApiData>; // ALO, VER, HAM...
}

/* -------------------- SESSION -------------------- */

export interface RaceSession {
  year: number;
  Date: string;
  event: string;
  location: string;
  type: string; // "Race"
  totalLaps: number;

  /** Local track time when race started */
  localTimeAtRaceStart: string;

  /** Sector distance cut points (normalized lap distance) */
  sectorDistanceRatios: SectorDistanceRatios;
}

/* -------------------- DRIVER -------------------- */

export interface DriverApiData {
  driverNumber: string;
  team: string;

  timing: DriverTimingApiData;

  personalBestLaps: PersonalBestLapApi[];
}

/* -------------------- TIMING (AUTHORITATIVE) -------------------- */

export interface DriverTimingApiData {
  laps: TimingLapApi[];
  pitStops: PitStopApi[];
}

/* One completed lap */
export interface TimingLapApi {
  lapNumber: number;

  /** Absolute race seconds */
  lapStartTime: number;

  /** Lap duration in seconds */
  lapTime: number;

  /** Sector times in seconds
   *  Index: [0]=S1, [1]=S2, [2]=S3
   *  Lap 1 S1 may be null
   */
  sectorTimes: (number | null)[];

  /** Official classification at lap end */
  positionAtLapEnd: number;
}

/* Sector timing */
export interface SectorTimingApi {
  sector: 1 | 2 | 3;
  time: number;

  isPersonalBest: boolean;
  isSessionBest: boolean;
}

/* -------------------- PIT STOPS -------------------- */

export interface PitStopApi {
  lapNumber: number;

  pitInTime: number;
  pitOutTime: number;

  totalTime: number;
}

/* -------------------- PERSONAL BEST -------------------- */

export interface PersonalBestLapApi {
  lapNumber: number;
  lapTime: number;
}

/* -------------------- SECTOR DISTANCES RATIOS -------------------- */

export interface SectorDistanceRatios {
  sector1: number; // 0 → 1
  sector2: number; // 0 → 1
  sector3: number; // always 1
}
