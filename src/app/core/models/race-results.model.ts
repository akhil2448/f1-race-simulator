export interface RaceResultsResponse {
  winnerFinishTime: number;
  raceEndTime: number;
  totalLaps: number;

  classification: RaceClassificationEntry[];
}

export interface RaceClassificationEntry {
  driver: string;

  position: number;

  status: 'FINISHED' | 'OUT';

  statusText: string;

  displayGap: string;

  finishTime: number | null;

  gapToLeader: number | null;

  lapsCompleted: number;

  lapsDown: number;

  points: number;
}
