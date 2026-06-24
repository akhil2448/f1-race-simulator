export interface SectorMarker {
  sector: string;
  time: number;
  rd: number;
}

export interface TelemetryPoint {
  idx: number;
  rd: number;
  t: number;
  d: number;

  speed: number;
  rpm: number;
  throttle: number;
  brake: boolean;
  gear: number;

  x: number;
  y: number;
}

export interface DriverLap {
  driver: string;

  teamName: string;
  teamColor: string;
  position: number;

  lapNumber: number;
  lapTime: number;

  sector1: number;
  sector2: number;
  sector3: number;

  sampleCount: number;
  maxDistance: number;

  startPoint: {
    x: number;
    y: number;
  };

  endPoint: {
    x: number;
    y: number;
  };

  sectorMarkers: SectorMarker[];

  telemetry: TelemetryPoint[];
}

export interface TrackMap {
  points: {
    x: number;
    y: number;
  }[];

  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };

  startPoint: {
    x: number;
    y: number;
  };

  startFinish: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface QualifyingComparisonResponse {
  sessionPart: string;

  trackMap: TrackMap;

  driverA: DriverLap;

  driverB: DriverLap | null;
}
