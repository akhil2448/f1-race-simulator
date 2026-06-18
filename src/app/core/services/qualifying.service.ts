import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

export interface QualifyingDriver {
  position: number;

  driverNumber: string;

  abbreviation: string;

  driverId: string;

  lastName: string;

  teamName: string;

  teamColor: string;

  headshotUrl: string;

  gridPosition: number;

  q1: string | null;

  q2: string | null;

  q3: string | null;

  finalSession: 'Q1' | 'Q2' | 'Q3';

  finalLapTime: string;
}

export interface QualifyingResponse {
  session: {
    year: number;
    round: number;
    raceName: string;
  };

  qualifyingResults: QualifyingDriver[];
}

@Injectable({
  providedIn: 'root',
})
export class QualifyingService {
  private readonly http = inject(HttpClient);

  getQualifying(year: number, round: number): Observable<QualifyingResponse> {
    return this.http.get<QualifyingResponse>(
      `/api/qualifying/${year}/${round}`,
    );
  }
}
