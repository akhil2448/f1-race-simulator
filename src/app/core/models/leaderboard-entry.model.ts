export interface LeaderboardEntry {
  position: number;
  driver: string;
  lap: number;
  distance: number;
  gapToLeader: number; // seconds (0 for leader)
  intervalGap: number; // seconds from preceeding driver
  isInPit: boolean;
  compound: string;

  positionArrow?: 'up' | 'down';

  tyreLife?: number;
  pitStops?: number;
}

export type GapMode = 'LEADER' | 'INTERVAL';
