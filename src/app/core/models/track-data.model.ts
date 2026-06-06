export interface TrackInfo {
  eventName: string;
  location: string;
  country: string;
  officialEventName: string;
  trackLength: number;
  timingLoopCount: number;
  timingLoopSpacing: number;
}

export interface TrackPoint {
  x: number;
  y: number;
  isStart?: boolean;
  isFinish?: boolean;
}

export interface TrackData {
  trackInfo: TrackInfo;
  coordinates: TrackPoint[];
}
