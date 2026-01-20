import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';

import { LiveTimingService } from './live-timing.service';
import { TelemetryInterpolationService } from './telemetry-interpolation.service';
import { LiveDriverState } from '../models/live-driver-state.model';
import { TelemetryFrame } from '../models/race-telemetry.model';

@Injectable({ providedIn: 'root' })
export class LiveTelemetryVisualTimingService {
  private subject = new BehaviorSubject<LiveDriverState[]>([]);
  visualState$ = this.subject.asObservable();

  private baseGap = new Map<string, number>();
  private visualGap = new Map<string, number>();
  private lastLeaderCompletedLaps = -1;

  constructor(
    private timing: LiveTimingService,
    private telemetry: TelemetryInterpolationService,
  ) {
    this.bind();
  }

  private bind(): void {
    combineLatest([
      this.timing.state$,
      this.telemetry.interpolatedFrame$,
    ]).subscribe(
      ([states, frame]: [LiveDriverState[], TelemetryFrame | null]) => {
        if (!states.length || !frame) return;

        const next: LiveDriverState[] = states.map((s) => ({ ...s }));

        const leader = next[0];
        const leaderCar = frame.cars.find((c) => c.driver === leader.driver);
        if (!leaderCar) return;

        /* ===============================
         LAP BOUNDARY
         =============================== */
        if (leader.completedLaps !== this.lastLeaderCompletedLaps) {
          this.baseGap.clear();
          this.visualGap.clear();
          this.lastLeaderCompletedLaps = leader.completedLaps;
        }

        /* ===============================
         LATCH LAP-END GAPS
         =============================== */
        next.forEach((s) => {
          if (s.gapToLeader != null && !this.baseGap.has(s.driver)) {
            this.baseGap.set(s.driver, s.gapToLeader);
          }
        });

        /* ===============================
         VISUAL INTERPOLATION
         =============================== */
        for (let i = 1; i < next.length; i++) {
          const curr = next[i];
          const prev = next[i - 1];

          const currCar = frame.cars.find((c) => c.driver === curr.driver);
          if (!currCar) continue;

          // 🔒 HARD GUARANTEE: base MUST be a number
          const base = this.baseGap.get(curr.driver) ?? curr.gapToLeader;

          if (base == null) continue;

          const distDelta = leaderCar.raceDistance - currCar.raceDistance;
          const correction = distDelta * 0.00005;

          const prevVisual = this.visualGap.get(curr.driver) ?? base;

          const visual = prevVisual + (base + correction - prevVisual) * 0.15;

          this.visualGap.set(curr.driver, visual);

          // 🔒 P2 MUST ALWAYS USE LAP-END GAP
          if (i === 1) {
            curr.gapToLeader = base; // ← authoritative lap timing
          } else {
            curr.gapToLeader = visual; // ← visual smoothing allowed
          }

          // ===============================
          // F1-CORRECT INTERVAL RULES
          // ===============================

          // P2 → gap to leader (not interval math)
          if (i === 1) {
            curr.intervalGap = curr.gapToLeader;
          }
          // P3+ → interval to car ahead
          else if (curr.gapToLeader != null && prev.gapToLeader != null) {
            curr.intervalGap = curr.gapToLeader - prev.gapToLeader;
          } else {
            curr.intervalGap = null;
          }
        }

        this.subject.next(next);
      },
    );
  }
}
