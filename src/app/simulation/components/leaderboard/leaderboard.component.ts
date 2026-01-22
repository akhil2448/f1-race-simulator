import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  GapMode,
  LeaderboardEntry,
} from '../../../core/models/leaderboard-entry.model';
import { LeaderboardService } from '../../../core/services/leaderboard.service';
import { CommonModule } from '@angular/common';
import { DriverMetaService } from '../../../core/services/driver-meta.service';
import { TrackStatusComponent } from '../track-status/track-status.component';
import { TrackStatusService } from '../../../core/services/track-status.service';
import { TrackStatusType } from '../../../core/constants/track-status.types';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, TrackStatusComponent],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit, AfterViewInit {
  leaderboard: LeaderboardEntry[] = [];
  leaderLap = 0;
  totalLaps = 0;

  private rowPositions = new Map<string, number>();

  @ViewChildren('driverRow', { read: ElementRef })
  rows!: QueryList<ElementRef<HTMLElement>>;

  /** UI STATE */
  showTyres = false;
  private tyreTimer?: number;

  trackStatus: TrackStatusType | null = null;

  showPitStops = false;

  raceFinished = false;

  constructor(
    private leaderboardService: LeaderboardService,
    private driverMeta: DriverMetaService,
    private trackStatusService: TrackStatusService,
  ) {
    this.trackStatusService.status$.subscribe((status) => {
      this.trackStatus = status;
    });
  }

  ngOnInit(): void {
    this.leaderboardService.leaderboard$.subscribe((state) => {
      this.leaderboard = state.entries;
      this.leaderLap = state.leaderLap;
      this.totalLaps = state.totalLaps;
      this.raceFinished = state.raceFinished;

      requestAnimationFrame(() => this.runFLIP());
    });
  }

  ngAfterViewInit(): void {
    this.runFLIP();
  }

  /* ===================================================== */
  /* FLIP ANIMATION                                        */
  /* ===================================================== */
  private runFLIP(): void {
    if (!this.rows || this.trackStatus === 'RED') return;

    this.rows.forEach((rowRef) => {
      const row = rowRef.nativeElement;
      const driver = row.dataset['driver'];
      if (!driver) return;

      const prevTop = this.rowPositions.get(driver);
      const newTop = row.offsetTop;

      if (prevTop !== undefined && prevTop !== newTop) {
        row.style.transition = 'none';
        row.style.transform = `translateY(${prevTop - newTop}px)`;

        requestAnimationFrame(() => {
          row.style.transition = 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)';
          row.style.transform = '';
        });
      }

      this.rowPositions.set(driver, newTop);
    });
  }

  /* ===================================================== */
  /* UI HELPERS                                            */
  /* ===================================================== */

  getDriverTeam(driverCode: string): string | undefined {
    return this.driverMeta.getTeamByDriverCode(driverCode);
  }

  onTeamLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/team-logos/plcholder.svg';
    img.className = 'plcholder';
  }

  getDriverColor(driverCode: string): string {
    return this.driverMeta.get(driverCode)?.color ?? '#888888';
  }

  trackByDriver(_: number, row: LeaderboardEntry) {
    return row.driver;
  }

  /* ===================================================== */
  /* TYRE LIFE TOGGLE                                      */
  /* ===================================================== */

  showTyreLife(): void {
    this.showTyres = true;

    clearTimeout(this.tyreTimer);
    this.tyreTimer = window.setTimeout(() => {
      this.showTyres = false;
    }, 5000);
  }

  /* ===================================================== */
  /* PITSTOP COUNT TOGGLE                                  */
  /* ===================================================== */
  showPitStopsTemporarily(): void {
    this.showPitStops = true;

    setTimeout(() => {
      this.showPitStops = false;
    }, 5000);
  }

  /* ===================================================== */
  /* GAP FORMATTER                                         */
  /* ===================================================== */

  formatGap(row: LeaderboardEntry): string {
    // 🚧 DRIVER IN PIT
    if (row.isInPit) {
      return 'IN PIT';
    }

    // 🏁 RACE FINISHED — FINAL CLASSIFICATION
    if (this.raceFinished) {
      if (row.position === 1) {
        return 'Winner';
      }

      if (row.lapsDown && row.lapsDown > 0) {
        return `+${row.lapsDown} LAP${row.lapsDown > 1 ? 'S' : ''}`;
      }

      return row.gapToLeader != null ? `+${row.gapToLeader.toFixed(3)}` : '–';
    }

    // LEADER ROW (LIVE)
    if (row.position === 1) {
      return this.leaderLap >= 4 ? 'Interval' : 'Leader';
    }

    // NO DATA YET
    if (row.gapToLeader == null && row.intervalGap == null) {
      return '–';
    }

    // 🟡 LAPS 1–3 → GAP TO LEADER
    if (this.leaderLap < 4) {
      return row.gapToLeader != null ? `+${row.gapToLeader.toFixed(3)}` : '–';
    }

    // 🔵 LAP 4+ → INTERVAL
    return row.intervalGap != null ? `+${row.intervalGap.toFixed(3)}` : '–';
  }
}

// ─────────────────────────────────────────────────────
// 🚨 FUTURE: LAPPED CAR DISPLAY (F1 BROADCAST RULE)
//
// F1 DOES NOT show "+1 LAP" during green-flag racing.
// Time gaps are still shown even if the driver is lapped.
//
// "+1 LAP / +2 LAPS" is shown ONLY when:
//   • Safety Car / Red Flag (timing frozen)
//   • Race finished (final classification)
//
// When enabling later, logic will be:
//
// if (row.lapsDown && row.lapsDown > 0) {
//   if (this.trackStatus !== 'GREEN' || this.raceFinished) {
//     return `+${row.lapsDown} LAP${row.lapsDown > 1 ? 'S' : ''}`;
//   }
// }
//
// ⚠️ DO NOT enable during green race — breaks realism
// ─────────────────────────────────────────────────────
