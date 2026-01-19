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

  sectors: SectorTimingApi[];

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
