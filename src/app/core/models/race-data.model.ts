export interface RaceSession {
  year: number;
  Date: string;
  event: string;
  location: string;
  type: string;
  totalLaps: number;
}

export interface PitStopData {
  LapNumber: number;
  PitInTime: number | null;
  PitOutTime: number | null;
  Compound: string;
}

export interface DriverApiData {
  DriverNumber: string;
  Team: string;
  laps: any[]; // empty, unused (can remove later)
  PitStopData: PitStopData[];
  PersonalBestLaps: number[];
}

export interface RaceApiResponse {
  session: RaceSession;
  drivers: Record<string, DriverApiData>;
}
