export interface SessionData {
  year: number;
  Date: string;
  event: string;
  location: string;
  type: string;
  totalLaps: number;
}

export interface FrameData {
  raceSecond: number;
  trackStatus: number;
}

export interface TrackStatusApiResponse {
  session: SessionData;
  trackStatusData: FrameData[];
}
