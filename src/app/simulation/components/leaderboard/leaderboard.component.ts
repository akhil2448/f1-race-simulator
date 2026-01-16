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

  // For leaderboard position change transition
  private rowPositions = new Map<string, number>();

  @ViewChildren('driverRow', { read: ElementRef })
  rows!: QueryList<ElementRef<HTMLElement>>;

  gapMode: GapMode = 'LEADER';

  constructor(
    private leaderboardService: LeaderboardService,
    private driverMeta: DriverMetaService
  ) {}

  ngOnInit(): void {
    this.leaderboardService.leaderboard$.subscribe((state) => {
      this.leaderboard = state.entries;
      this.leaderLap = state.leaderLap;
      this.totalLaps = state.totalLaps;

      // wait for DOM update, then animate
      requestAnimationFrame(() => this.runFLIP());
    });
  }

  ngAfterViewInit(): void {
    this.runFLIP();
  }

  private runFLIP(): void {
    if (!this.rows) return;

    this.rows.forEach((rowRef) => {
      const row = rowRef.nativeElement;
      const driver = row.dataset['driver'];
      if (!driver) return;

      const prevTop = this.rowPositions.get(driver);
      const newTop = row.offsetTop;

      if (prevTop !== undefined) {
        const delta = prevTop - newTop;

        if (delta !== 0) {
          row.style.transition = 'none';
          row.style.transform = `translateY(${delta}px)`;

          requestAnimationFrame(() => {
            row.style.transition =
              'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)';
            row.style.transform = '';
          });
        }
      }

      this.rowPositions.set(driver, newTop);
    });
  }

  getDriverTeam(driverCode: string): string | undefined {
    return this.driverMeta.getTeamByDriverCode(driverCode);
  }

  trackByDriver(_: number, row: LeaderboardEntry) {
    return row.driver;
  }

  formatGap(row: LeaderboardEntry): string {
    if (row.position === 1) {
      return row.lap <= 3 ? 'LEADER' : 'INTERVAL';
    }

    const gap = row.lap <= 3 ? row.gapToLeader : row.intervalGap;

    return `+${gap.toFixed(3)}`;
  }
}
