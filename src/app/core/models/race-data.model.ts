/* -------------------- ROOT API RESPONSE -------------------- */

export interface RaceApiResponse {
  session: RaceSession;
  results: RaceResultsApi;
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

/* -------------------- RACE RESULTS -------------------- */

export interface RaceResultsApi {
  winnerFinishTime: number;

  totalLaps: number;

  classification: RaceClassificationEntry[];

  driverStandings: DriverStandingEntry[];

  constructorStandings: ConstructorStandingEntry[];

  fastestLap: FastestLapEntry;
}

export interface RaceClassificationEntry {
  driver: string;

  fullName: string;

  driverNumber: string;

  team: string;

  position: number;

  status: 'FINISHED' | 'OUT';

  statusText: string;

  displayGap: string;

  finishTime: number | null;

  gapToLeader: number | null;

  lapsCompleted: number;

  lapsDown: number;

  points: number;
}

export interface DriverStandingEntry {
  position: number;

  driver: string;

  driverCode: string;

  team: string;

  points: number;
}

export interface ConstructorStandingEntry {
  position: number;

  teamName: string;

  team: string;

  points: number;
}

export interface FastestLapEntry {
  driver: string;

  fullName: string;

  team: string;

  lapNumber: number;

  lapTime: string;
}

/* -------------------- DRIVER -------------------- */

export interface DriverApiData {
  driverNumber: string;
  team: string;

  timing: DriverTimingApiData;

  personalBestLaps: number[];
}

/* -------------------- TIMING (AUTHORITATIVE) -------------------- */

export interface DriverTimingApiData {
  laps: TimingLapApi[];
  pitStops: PitStopApi[];
}

/* One completed lap */
export interface TimingLapApi {
  lap: number;

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

  /** laps on current tyre */
  tyreLife?: number;
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
  /** Lap on which the pit event occurred (in-lap) */
  lapNumber: number;

  /** Seconds since race start when car entered pit lane */
  pitInTime: number | null;

  /** Seconds since race start when car exited pit lane */
  pitOutTime: number | null;

  /** Tyre compound fitted after this stop */
  compound?: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
}

/* -------------------- SECTOR DISTANCES RATIOS -------------------- */

export interface SectorDistanceRatios {
  sector1: number; // 0 → 1
  sector2: number; // 0 → 1
  sector3: number; // always 1
}
