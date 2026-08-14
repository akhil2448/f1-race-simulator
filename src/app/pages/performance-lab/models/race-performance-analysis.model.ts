export interface RaceAnalyzerResponse {
  race: RaceInfo;
  referenceDriver: string;
  trackMetadata: TrackMetadata;
  drivers: RaceAnalyzerDriver[];
}

export interface RaceInfo {
  year: number;
  round: number;
  eventName: string;
  country: string;
  location: string;
  circuit: string;
  totalLaps: number;
}

export interface TrackMetadata {
  statusRanges: TrackStatusRange[];
  rainRanges: RainRange[];
}

export interface TrackStatusRange {
  status: string;
  startLap: number;
  endLap: number;
}

export interface RainRange {
  startLap: number;
  endLap: number;
  intensity?: string;
}

export interface RaceAnalyzerDriver {
  driver: string;
  driverNumber: string;
  fullName: string;
  headshotUrl: string;
  countryCode: string;
  teamName: string;
  teamColor: string;
  stints: DriverStint[];
}

export interface DriverStint {
  stint: number;
  compound: string;
  startingTyreAge: number;
  endingTyreAge: number;
  startLap: number;
  endLap: number;
  laps: RaceAnalyzerLap[];
}

export interface RaceAnalyzerLap {
  lapNumber: number;
  trackStatus: number;
  lapTime: number | null;

  sector1: number | null;
  sector2: number | null;
  sector3: number | null;

  tyreLife: number;
  position: number;

  pitIn: boolean;
  pitOut: boolean;

  personalBest: boolean;

  speed: LapSpeed;
  distribution: LapDistribution;

  gearShifts: number;
}

export interface LapSpeed {
  top: number;
  minimum: number;
  average: number;
}

export interface LapDistribution {
  fullThrottle: number;
  brake: number;
  rolling: number;
  partialThrottle: number;
  liftAndCoast: number;

  cornering: number;
  clipping: number;
}
