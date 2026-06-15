import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
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
import {
  LeaderboardDisplayMode,
  LeaderboardDisplayService,
} from '../../../core/services/leaderboard-display.service';
import { RaceFinishService } from '../../../core/services/race-finish.service';
import { FastestLapService } from '../../../core/services/fastest-lap.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, TrackStatusComponent],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit, AfterViewInit, OnDestroy {
  leaderboard: LeaderboardEntry[] = [];
  leaderLap = 0;
  totalLaps = 0;

  private rowPositions = new Map<string, number>();

  private displayedArrows = new Map<string, HTMLDivElement>();

  fastestLapDriver: string | null = null;

  finishedDrivers = new Set<string>();

  private alreadyAnimatedDrivers = new Set<string>();

  animatingFinishFlags = new Set<string>();

  @ViewChildren('driverRow', { read: ElementRef })
  rows!: QueryList<ElementRef<HTMLElement>>;

  /** UI STATE */
  baseMode: LeaderboardDisplayMode = 'LEADER_GAP';
  activeTemporaryMode: LeaderboardDisplayMode | null = null;
  //private temporaryModeTimer?: number;

  raceFinished = false;

  trackStatus: TrackStatusType | null = null;

  /** 🔑 Broadcast anchors */
  private greenLap: number | null = null;

  constructor(
    private leaderboardService: LeaderboardService,
    private driverMeta: DriverMetaService,
    private trackStatusService: TrackStatusService,
    private leaderboardDisplay: LeaderboardDisplayService,
    private raceFinish: RaceFinishService,
    private fastestLap: FastestLapService,
  ) {
    // Track flag state
    this.trackStatusService.status$.subscribe((status) => {
      this.trackStatus = status;
    });

    // Fire on every GREEN (race start + restarts)
    this.trackStatusService.greenEvent$.subscribe(() => {
      this.greenLap = this.leaderLap || 1;
      this.clearTemporaryMode();
      this.updateBaseMode();
    });

    this.leaderboardDisplay.temporaryMode$.subscribe((mode) => {
      this.activeTemporaryMode = mode;
    });
  }

  ngOnInit(): void {
    this.leaderboardService.leaderboard$.subscribe((state) => {
      this.leaderboard = state.entries;
      this.leaderLap = state.leaderLap;
      this.totalLaps = state.totalLaps;
      this.raceFinished = state.raceFinished;
      this.updateBaseMode();

      requestAnimationFrame(() => this.runFLIP());
    });

    this.raceFinish.finishedDrivers$.subscribe((drivers) => {
      this.finishedDrivers = drivers;

      drivers.forEach((driver) => {
        if (this.alreadyAnimatedDrivers.has(driver)) {
          return;
        }

        this.alreadyAnimatedDrivers.add(driver);
        this.animatingFinishFlags.add(driver);

        setTimeout(() => {
          this.animatingFinishFlags.delete(driver);
        }, 2200);
      });
    });

    this.fastestLap.fastestDriver$.subscribe((driver) => {
      this.fastestLapDriver = driver;
    });
  }

  ngAfterViewInit(): void {
    this.runFLIP();
  }

  ngOnDestroy(): void {}

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

    return this.leaderLap < this.greenLap + 1;
  }

  get activeDisplayMode(): LeaderboardDisplayMode {
    return this.activeTemporaryMode ?? this.baseMode;
  }

  get isTemporaryModeActive(): boolean {
    return this.activeTemporaryMode !== null;
  }

  private updateBaseMode(): void {
    if (this.greenLap === null || this.leaderLap <= this.greenLap + 1) {
      this.baseMode = 'LEADER_GAP';
      return;
    }

    this.baseMode = 'INTERVAL';
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
        const movedUp = newTop < prevTop;

        const rowHeight = row.offsetHeight || 32;

        const placesChanged = Math.max(
          1,
          Math.round(Math.abs(prevTop - newTop) / rowHeight),
        );

        this.spawnPositionArrow(
          row,
          movedUp ? 'up' : 'down',
          Math.round(placesChanged),
        );

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

  private spawnPositionArrow(
    row: HTMLElement,
    direction: 'up' | 'down',
    places: number,
  ): void {
    const driver = row.dataset['driver'];

    if (!driver) return;

    const positionBox = row.querySelector('.position') as HTMLElement | null;

    const posNumber = row.querySelector('.pos-number') as HTMLElement | null;

    if (!positionBox || !posNumber) return;

    // remove old arrow if already active
    const existingArrow = this.displayedArrows.get(driver);

    if (existingArrow) {
      existingArrow.remove();
      this.displayedArrows.delete(driver);
    }

    positionBox.classList.add('arrow-active');

    const arrow = document.createElement('div');

    arrow.className = `flip-overtake-arrow ${direction}`;

    arrow.style.color = direction === 'up' ? '#00ff87' : '#ff3b3b';

    arrow.textContent =
      places > 1
        ? `${direction === 'up' ? '▲' : '▼'}${places}`
        : direction === 'up'
          ? '▲'
          : '▼';

    positionBox.appendChild(arrow);

    this.displayedArrows.set(driver, arrow);

    const currentArrow = arrow;

    setTimeout(() => {
      const activeArrow = this.displayedArrows.get(driver);

      // another newer arrow already exists
      if (activeArrow !== currentArrow) {
        return;
      }

      currentArrow.remove();

      positionBox.classList.remove('arrow-active');

      this.displayedArrows.delete(driver);
    }, 1200);
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

  isDriverFinished(driver: string): boolean {
    return this.finishedDrivers.has(driver);
  }

  isFastestLapHolder(driver: string): boolean {
    return this.fastestLapDriver === driver;
  }

  isFinishFlagAnimating(driver: string): boolean {
    return this.animatingFinishFlags.has(driver);
  }

  /* ===================================================== */
  /* TOGGLES                                               */
  /* ===================================================== */

  showTyreLife(): void {
    this.leaderboardDisplay.showTemporaryMode('TYRE');
  }

  showPitStopsTemporarily(): void {
    this.leaderboardDisplay.showTemporaryMode('PIT');
  }

  showLappedTemporarily(): void {
    this.leaderboardDisplay.showTemporaryMode('LAPPED');
  }

  private clearTemporaryMode(): void {
    this.leaderboardDisplay.clearTemporaryMode();
  }

  private formatGap(seconds: number): string {
    /**
     * Under 2 minutes:
     * +12.3
     */
    if (seconds < 120) {
      return `+${seconds.toFixed(1)}`;
    }

    /**
     * 2 minutes or more:
     * 2:03.4
     */
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    const wholeSeconds = Math.floor(remainingSeconds);

    const tenth = Math.floor((remainingSeconds % 1) * 10);

    return `+${minutes}:${String(wholeSeconds).padStart(2, '0')}.${tenth}`;
  }

  /* ===================================================== */
  /* GAP FORMATTERS                                        */
  /* ===================================================== */

  formatDisplayValue(row: LeaderboardEntry): string {
    if (
      row.isOfficialClassification &&
      this.activeDisplayMode !== 'TYRE' &&
      this.activeDisplayMode !== 'PIT' &&
      this.activeDisplayMode !== 'LAPPED'
    ) {
      return row.displayGap ?? '–';
    }

    if (row.status === 'OUT') {
      return this.activeDisplayMode === 'TYRE' ||
        this.activeDisplayMode === 'PIT'
        ? '–'
        : 'OUT';
    }

    switch (this.activeDisplayMode) {
      case 'LEADER_GAP':
        return this.formatLeaderGap(row);
      case 'INTERVAL':
        return this.formatIntervalGap(row);
      case 'TYRE':
        return row.tyreLife != null ? String(row.tyreLife) : '–';
      case 'PIT':
        return row.pitStops != null ? String(row.pitStops) : '0';
      case 'LAPPED':
        return this.formatLappedMode(row);
    }
  }

  formatLeaderGap(row: LeaderboardEntry): string {
    // 🚧 PIT HAS HIGHEST PRIORITY
    if (row.isInPit) return 'IN PIT';

    if (row.position === 1) return 'Leader';

    return row.gapToLeader != null ? this.formatGap(row.gapToLeader) : '–';
  }

  formatIntervalGap(row: LeaderboardEntry): string {
    // 🚧 PIT HAS HIGHEST PRIORITY
    if (row.isInPit) return 'IN PIT';

    if (row.position === 1) return 'Interval';

    return row.intervalGap != null ? this.formatGap(row.intervalGap) : '–';
  }

  private formatLappedMode(row: LeaderboardEntry): string {
    if (row.isInPit) return 'IN PIT';

    if (row.position === 1) return 'Leader';

    const lapsDown = row.lapsDown ?? 0;

    /**
     * EDGE CASE:
     * leader just crossed line,
     * but car is still effectively close
     *
     * show reconstructed time gap instead
     * of ugly +1 LAP jump
     */
    if (lapsDown === 1 && row.gapToLeader != null && row.gapToLeader < 120) {
      return this.formatGap(row.gapToLeader);
    }

    /**
     * Genuine lapped cars
     */
    if (lapsDown > 0) {
      return `+${lapsDown} ${lapsDown === 1 ? 'LAP' : 'LAPS'}`;
    }

    return this.formatLeaderGap(row);
  }
}
