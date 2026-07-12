export interface DriverSelectionDriver {
  driverCode: string;

  driverLastName: string;

  teamName: string;

  teamColor: string;

  position: number;
}

export interface DriverSelectionResponse {
  year: number;

  round: number;

  raceName: string;

  sessions: {
    Q1: DriverSelectionDriver[];

    Q2: DriverSelectionDriver[];

    Q3: DriverSelectionDriver[];
  };
}

export interface RaceManagementDriversResponse {
  year: number;

  round: number;

  totalRaceLaps: number;

  tyreCompounds: string[];

  drivers: RaceManagementDriver[];
}

export interface RaceManagementDriver {
  driverNumber: string;

  driverCode: string;

  firstName: string;

  lastName: string;

  fullName: string;

  team: string;

  teamColor: string;

  gridPosition: number;

  finishPosition: number;

  status: string;

  lapsCompleted: number;

  stints: RaceManagementStint[];
}

export interface RaceManagementStint {
  stint: number;

  compound: string;

  freshTyre: boolean;

  startLap: number;

  endLap: number;

  lapCount: number;
}
