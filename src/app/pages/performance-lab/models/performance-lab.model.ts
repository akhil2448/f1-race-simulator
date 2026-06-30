export interface DriverSelectionDriver {
  code: string;

  lastName: string;

  teamName: string;

  teamColor: string;

  position: number;
}

export interface DriverSelectionSession {
  drivers: DriverSelectionDriver[];
}

export interface DriverSelectionResponse {
  year: number;

  round: number;

  raceName: string;

  q1: DriverSelectionSession;

  q2: DriverSelectionSession;

  q3: DriverSelectionSession;
}
