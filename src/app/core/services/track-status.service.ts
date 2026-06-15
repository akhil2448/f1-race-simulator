import { BehaviorSubject, Subject } from 'rxjs';
import {
  TRACK_STATUS_MAP,
  TrackStatusType,
} from '../constants/track-status.types';
import { Injectable } from '@angular/core';
import { RaceClockService } from './race-clock-service';
import { FrameData } from '../models/track-status.model';
import { LeaderboardService } from './leaderboard.service';

// ‘1’: Track clear (beginning of session or to indicate the end of another status)
// ‘2’: Yellow flag (sectors are unknown)
// ‘3’: ??? Never seen so far, does not exist?
// ‘4’: Safety Car
// ‘5’: Red Flag
// ‘6’: Virtual Safety Car deployed
// ‘7’: Virtual Safety Car ending (As indicated on the drivers steering wheel, on tv and so on;
//      status ‘1’ will mark the actual end)

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

  private lastStatus: TrackStatusType | null = null;
  private transientStatusUntil: number | null = null;

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

  private isTransientStatus(status: TrackStatusType | null): boolean {
    return status === 'GREEN' || status === 'VSC_ENDING';
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

    /**
     * Keep transient statuses visible
     * ONLY if backend status has not changed.
     */
    if (
      active === this.lastStatus &&
      this.isTransientStatus(this.lastStatus) &&
      this.transientStatusUntil != null &&
      currentSecond < this.transientStatusUntil
    ) {
      return;
    }

    /**
     * Auto-hide transient statuses
     * after visibility duration expires.
     */
    if (
      active === this.lastStatus &&
      this.isTransientStatus(active) &&
      this.transientStatusUntil != null &&
      currentSecond >= this.transientStatusUntil
    ) {
      this.statusSubject.next(null);

      this.lastStatus = null;
      this.transientStatusUntil = null;

      return;
    }

    if (active === this.lastStatus) {
      return;
    }

    this.lastStatus = active;

    /**
     * Persistent neutralized states
     */
    if (
      active === 'YELLOW' ||
      active === 'RED' ||
      active === 'SC' ||
      active === 'VSC'
    ) {
      this.transientStatusUntil = null;

      this.statusSubject.next(active);
      this.neutralizedSubject.next(true);

      return;
    }

    /**
     * Temporary VSC ENDING
     */
    if (active === 'VSC_ENDING') {
      this.transientStatusUntil = currentSecond + 3;

      this.statusSubject.next(active);
      this.neutralizedSubject.next(true);

      return;
    }

    /**
     * GREEN / restart
     */
    if (active === 'GREEN') {
      this.transientStatusUntil = currentSecond + 3;

      this.statusSubject.next('GREEN');
      this.neutralizedSubject.next(false);

      this.greenAtLap = this.leaderboard.getLeaderLap();
      this.greenEventSubject.next();

      return;
    }

    this.statusSubject.next(active);
  }

  /** ✅ Synchronous access for services */
  isNeutralizedSnapshot(): boolean {
    return this.neutralizedSubject.value;
  }
}
