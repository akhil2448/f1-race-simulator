import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { LeaderboardEntry } from '../../../core/models/leaderboard-entry.model';
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

  showPitStops = false;
  raceFinished = false;

  trackStatus: TrackStatusType | null = null;

  /** 🔑 Broadcast anchors */
  private greenLap: number | null = null;

  constructor(
    private leaderboardService: LeaderboardService,
    private driverMeta: DriverMetaService,
    private trackStatusService: TrackStatusService,
  ) {
    // Track flag state
    this.trackStatusService.status$.subscribe((status) => {
      this.trackStatus = status;
    });

    // Fire on every GREEN (race start + restarts)
    this.trackStatusService.greenEvent$.subscribe(() => {
      this.greenLap = this.leaderLap || 1;
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
  /* 🔑 BROADCAST RULE GETTERS (CORRECTED)                 */
  /* ===================================================== */

  /** Hide leaderboard under flags + first 2 laps after GREEN */
  get hideLeaderboard(): boolean {
    if (
      this.trackStatus === 'RED' ||
      this.trackStatus === 'SC' ||
      this.trackStatus === 'VSC' ||
      this.trackStatus === 'VSC_ENDING' ||
      this.trackStatus === 'YELLOW'
    ) {
      return true;
    }

    if (this.greenLap === null) return true;

    return this.leaderLap < this.greenLap + 2;
  }

  /** Gap-to-leader mode for 2 laps after GREEN */
  get useLeaderGapMode(): boolean {
    if (this.greenLap === null) return true;

    return this.leaderLap < this.greenLap + 2;
  }

  /* ===================================================== */
  /* FLIP ANIMATION                                        */
  /* ===================================================== */
  private runFLIP(): void {
    if (!this.rows || this.hideLeaderboard) return;

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
  /* TOGGLES                                               */
  /* ===================================================== */

  showTyreLife(): void {
    this.showTyres = true;
    clearTimeout(this.tyreTimer);
    this.tyreTimer = window.setTimeout(() => {
      this.showTyres = false;
    }, 5000);
  }

  showPitStopsTemporarily(): void {
    this.showPitStops = true;
    setTimeout(() => {
      this.showPitStops = false;
    }, 5000);
  }

  /* ===================================================== */
  /* GAP FORMATTERS                                        */
  /* ===================================================== */

  formatLeaderGap(row: LeaderboardEntry): string {
    // 🚧 PIT HAS HIGHEST PRIORITY
    if (row.isInPit) return 'IN PIT';

    if (row.position === 1) return 'Leader';

    return row.gapToLeader != null ? `+${row.gapToLeader.toFixed(3)}` : '–';
  }

  formatIntervalGap(row: LeaderboardEntry): string {
    // 🚧 PIT HAS HIGHEST PRIORITY
    if (row.isInPit) return 'IN PIT';

    if (row.position === 1) return 'Interval';

    return row.intervalGap != null ? `+${row.intervalGap.toFixed(3)}` : '–';
  }
}
