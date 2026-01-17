import { BehaviorSubject } from 'rxjs';
import {
  TRACK_STATUS_MAP,
  TrackStatusType,
} from '../constants/track-status.types';
import { Injectable } from '@angular/core';
import { RaceClockService } from './race-clock-service';
import { FrameData } from '../models/track-status.model';

@Injectable({ providedIn: 'root' })
export class TrackStatusService {
  private statusTimeline: { raceSecond: number; status: TrackStatusType }[] =
    [];

  private statusSubject = new BehaviorSubject<TrackStatusType | null>(null);
  status$ = this.statusSubject.asObservable();

  private greenTimeout?: number;
  private lastStatus: TrackStatusType | null = null;

  constructor(private raceClock: RaceClockService) {
    this.raceClock.raceTime$.subscribe((second) => {
      this.resolveStatus(second);
    });
  }

  /** Call ONCE after API load */
  initialize(trackStatusData: FrameData[]): void {
    this.statusTimeline = trackStatusData.map((e) => ({
      raceSecond: e.raceSecond,
      status: TRACK_STATUS_MAP[e.trackStatus] ?? null,
    }));
  }

  private resolveStatus(currentSecond: number): void {
    if (!this.statusTimeline.length) return;

    let active: TrackStatusType | null = null;

    for (let i = 0; i < this.statusTimeline.length; i++) {
      if (this.statusTimeline[i].raceSecond <= currentSecond) {
        active = this.statusTimeline[i].status;
      } else {
        break;
      }
    }

    // ❌ Never show GREEN at race start
    if (active === 'GREEN' && this.lastStatus === null) {
      this.lastStatus = active;
      this.statusSubject.next(null);
      return;
    }

    // No change → do nothing
    if (active === this.lastStatus) return;

    this.lastStatus = active;
    clearTimeout(this.greenTimeout);

    // 🟡 VSC ENDING → temporary broadcast message
    if (active === 'VSC_ENDING') {
      this.statusSubject.next('VSC_ENDING');
      return;
    }

    // 🟢 GREEN → show for 5 seconds then clear
    if (active === 'GREEN') {
      this.statusSubject.next('GREEN');

      this.greenTimeout = window.setTimeout(() => {
        this.statusSubject.next(null);
      }, 5000);

      return;
    }

    // 🚨 All other flags persist
    this.statusSubject.next(active);
  }
}
