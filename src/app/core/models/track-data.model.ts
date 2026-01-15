export interface TrackInfo {
  eventName: string;
  location: string;
  country: string;
  officialEventName: string;
  trackLength: number;
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
