import {
  RaceAnalyzerDriver,
  RaceAnalyzerLap,
  DriverStint,
} from '../models/race-performance-analysis.model';

export interface SelectedLap {
  id: string;

  driver: RaceAnalyzerDriver;

  stint: DriverStint;

  lap: RaceAnalyzerLap;

  pinned: boolean;

  lineColor: string;
}
