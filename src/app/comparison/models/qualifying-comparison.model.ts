export interface SectorMarker {
  sector: string;

  time: number;

  rd: number;

  d: number;
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
  driverName: string;

  driverNumber: string;

  teamName: string;
  teamColor: string;

  position: number;

  lapNumber: number;

  compound: string | null;
  tyreAge: number | null;
  freshTyre: boolean | null;
  stint: number | null;

  lapTime: number;

  sector1: number;
  isSector1SessionFastest: boolean;

  sector2: number;
  isSector2SessionFastest: boolean;

  sector3: number;
  isSector3SessionFastest: boolean;

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

export interface TrackPoint {
  x: number;
  y: number;
}

export interface TrackCorner {
  number: number;

  x: number;
  y: number;

  angle: number;

  distance: number;
}

export interface TrackMap {
  sector1: TrackPoint[];

  sector2: TrackPoint[];

  sector3: TrackPoint[];

  corners: TrackCorner[];

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

  width: number;
  height: number;
}

export interface QualifyingComparisonResponse {
  year: number;

  grandPrix: string;

  sessionPart: string;

  trackMap: TrackMap;

  driverA: DriverLap;

  driverB: DriverLap | null;
}
