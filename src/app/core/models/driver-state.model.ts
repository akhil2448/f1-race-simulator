export interface PitWindow {
  in: number; // raceTime seconds
  out: number; // raceTime seconds
  compoundAfter: string;
  isPitLaneStart?: boolean;
}

export interface DriverInternalState {
  startingCompound: string;
  pitWindows: PitWindow[];
}

export interface DriverRaceState {
  isInPit: boolean;
  currentCompound: string;
}
