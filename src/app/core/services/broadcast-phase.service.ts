import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TrackStatusService } from './track-status.service';
import { LeaderboardService } from './leaderboard.service';

export type BroadcastPhase = 'HIDDEN' | 'GAP_TO_LEADER' | 'INTERVAL';

@Injectable({ providedIn: 'root' })
export class BroadcastPhaseService {
  private phaseSubject = new BehaviorSubject<BroadcastPhase>('HIDDEN');
  phase$ = this.phaseSubject.asObservable();

  private greenLeaderLap = 0;

  constructor(
    private trackStatus: TrackStatusService,
    private leaderboard: LeaderboardService,
  ) {
    // 🔴 Hide during neutralized race
    this.trackStatus.isNeutralized$.subscribe((neutralized) => {
      if (neutralized) {
        this.phaseSubject.next('HIDDEN');
      }
    });

    // 🟢 On green / restart
    this.trackStatus.greenEvent$.subscribe(() => {
      this.greenLeaderLap = this.leaderboard.getLeaderLap();
      this.phaseSubject.next('HIDDEN');
    });

    // 📡 Track leader lap progression
    this.leaderboard.leaderLap$.subscribe((lap) => {
      if (lap === 0) return;

      const lapsSinceGreen = lap - this.greenLeaderLap;

      if (lapsSinceGreen < 2) {
        this.phaseSubject.next('GAP_TO_LEADER');
      } else {
        this.phaseSubject.next('INTERVAL');
      }
    });
  }
}
