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

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
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

  constructor(
    private leaderboardService: LeaderboardService,
    private driverMeta: DriverMetaService
  ) {}

  ngOnInit(): void {
    this.leaderboardService.leaderboard$.subscribe((state) => {
      this.leaderboard = state.entries;
      this.leaderLap = state.leaderLap;
      this.totalLaps = state.totalLaps;

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
    if (!this.rows) return;

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
  /* GAP FORMATTER                                         */
  /* ===================================================== */

  formatGap(row: LeaderboardEntry): string {
    // TYRE LIFE MODE
    if (this.showTyres) {
      return row.tyreLife !== undefined ? `${row.tyreLife}` : '–';
    }

    // LEADER
    if (row.position === 1) {
      return row.lap <= 3 ? 'LEADER' : 'INTERVAL';
    }

    // FIRST 3 LAPS → LEADER GAP
    const gap =
      row.lap <= 3 ? row.gapToLeader : row.intervalGap ?? row.gapToLeader;

    return `+${gap.toFixed(3)}`;
  }
}
