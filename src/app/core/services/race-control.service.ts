import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, shareReplay } from 'rxjs';

export interface RaceControlMessage {
  id: string;

  raceSecond: number;

  category: string;
  message: string;

  flag?: string | null;
  status?: string | null;

  scope?: string | null;
  sector?: number | null;

  racingNumber?: string | null;

  lap?: number | null;
}

export interface RaceControlResponse {
  session: {
    year: number;
    Date: string;
    event: string;
    location: string;
    type: string;
  };

  messages: RaceControlMessage[];
}

@Injectable({
  providedIn: 'root',
})
export class RaceControlService {
  private http = inject(HttpClient);

  private cache = new Map<string, Observable<RaceControlResponse>>();

  private messages: RaceControlMessage[] = [];

  private loaded = false;

  getRaceControl(year: number, round: number): Observable<RaceControlResponse> {
    const key = `${year}-${round}`;

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const request$ = this.http
      .get<RaceControlResponse>(
        `http://localhost:8000/api/race-control/${year}/${round}`,
      )
      .pipe(shareReplay(1));

    request$.subscribe((data) => {
      this.messages = data.messages;
      this.loaded = true;
    });

    this.cache.set(key, request$);

    return request$;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getAllMessages(): RaceControlMessage[] {
    return this.messages;
  }

  clearCache(): void {
    this.cache.clear();

    this.messages = [];

    this.loaded = false;
  }
}
