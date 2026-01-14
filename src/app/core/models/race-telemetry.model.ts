export interface TelemetryCar {
  driver: string;
  lap: number;
  distance: number;
  x: number;
  y: number;
}

export interface TelemetryFrame {
  raceTime: number;
  cars: TelemetryCar[];
}
