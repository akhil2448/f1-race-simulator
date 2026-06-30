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
