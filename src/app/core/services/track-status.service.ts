import { BehaviorSubject, Subject } from 'rxjs';
import {
  TRACK_STATUS_MAP,
  TrackStatusType,
} from '../constants/track-status.types';
import { Injectable } from '@angular/core';
import { RaceClockService } from './race-clock-service';
import { FrameData } from '../models/track-status.model';
import { LeaderboardService } from './leaderboard.service';

@Injectable({ providedIn: 'root' })
export class TrackStatusService {
  private statusTimeline: { raceSecond: number; status: TrackStatusType }[] =
    [];

  private statusSubject = new BehaviorSubject<TrackStatusType | null>(null);
  status$ = this.statusSubject.asObservable();

  /** 🔴 true during yellow / SC / VSC / red */
  private neutralizedSubject = new BehaviorSubject<boolean>(false);
  isNeutralized$ = this.neutralizedSubject.asObservable();

  /** 🟢 fires ONCE for each green / restart */
  private greenEventSubject = new Subject<void>();
  greenEvent$ = this.greenEventSubject.asObservable();

  /** 🔑 Leader lap when GREEN occurred */
  private greenAtLap: number | null = null;

  private greenTimeout?: number;
  private lastStatus: TrackStatusType | null = null;

  constructor(
    private raceClock: RaceClockService,
    private leaderboard: LeaderboardService, // ✅ authoritative lap source
  ) {
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

    // ❌ Never visually show GREEN at race start
    if (active === 'GREEN' && this.lastStatus === null) {
      this.lastStatus = active;
      this.statusSubject.next(null);
      this.neutralizedSubject.next(false);

      // 🔑 race start counts as green
      this.greenAtLap = this.leaderboard.getLeaderLap();
      this.greenEventSubject.next();
      return;
    }

    if (active === this.lastStatus) return;

    this.lastStatus = active;
    clearTimeout(this.greenTimeout);

    // 🚨 Neutralized states
    if (
      active === 'YELLOW' ||
      active === 'RED' ||
      active === 'SC' ||
      active === 'VSC' ||
      active === 'VSC_ENDING'
    ) {
      this.statusSubject.next(active);
      this.neutralizedSubject.next(true);
      return;
    }

    // 🟢 GREEN / restart
    if (active === 'GREEN') {
      this.statusSubject.next('GREEN');
      this.neutralizedSubject.next(false);

      // 🔑 record lap of restart
      this.greenAtLap = this.leaderboard.getLeaderLap();
      this.greenEventSubject.next();

      this.greenTimeout = window.setTimeout(() => {
        this.statusSubject.next(null);
      }, 5000);

      return;
    }

    this.statusSubject.next(active);
  }

  /**
   * 🔑 Broadcast rule:
   * If GREEN happened mid-lap,
   * intervals resume ONLY from the next lap.
   */
  canResumeIntervals(currentLap: number): boolean {
    return this.greenAtLap === null || currentLap > this.greenAtLap;
  }

  /** ✅ Synchronous access for services */
  isNeutralizedSnapshot(): boolean {
    return this.neutralizedSubject.value;
  }
}
