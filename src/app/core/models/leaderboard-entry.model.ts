export interface LeaderboardEntry {
  position: number;
  driver: string;
  lap: number;
  distance: number;
  gapToLeader: number; // seconds (0 for leader)
  isInPit: boolean;
  compound: string;

  /** ▲ or ▼ (temporary) */
  positionArrow?: 'up' | 'down';
}
