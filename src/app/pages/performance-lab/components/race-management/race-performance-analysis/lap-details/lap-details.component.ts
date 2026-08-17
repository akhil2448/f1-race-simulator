import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { CommonModule } from '@angular/common';

import { SelectedLap } from '../../../../models/lap-details.model';
import { RaceInfo } from '../../../../models/race-performance-analysis.model';

@Component({
  selector: 'app-lap-details',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './lap-details.component.html',
  styleUrls: ['./lap-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LapDetailsComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true })
  selectedLaps: SelectedLap[] = [];

  @ViewChildren('lapCard', { read: ElementRef })
  private lapCards!: QueryList<ElementRef<HTMLElement>>;

  private previousRects = new Map<string, DOMRect>();

  private previousLapIds: string[] = [];

  private previousLaps: SelectedLap[] = [];

  private animationPending = false;

  private animationType: 'queue' | 'replace-first' | 'replace-second' | 'none' =
    'none';

  @Input({ required: true })
  race!: RaceInfo;

  @Output()
  remove = new EventEmitter<string>();
  @Output()
  togglePin = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['selectedLaps']) {
      return;
    }

    const previous = this.previousLaps;
    const current = this.selectedLaps;

    /*
     * Initial render.
     */
    if (previous.length === 0) {
      this.previousLaps = [...current];
      return;
    }

    /*
     * No actual selection change.
     */
    if (
      previous.length === current.length &&
      previous.every((lap, index) => lap.id === current[index]?.id)
    ) {
      /*
       * Pin/unpin only.
       * We don't animate the card position.
       */
      this.previousLaps = [...current];
      return;
    }

    /*
     * We only need the FLIP animation when two cards
     * already exist and two cards remain.
     */
    if (previous.length === 2 && current.length === 2) {
      /*
       * Capture the positions of the OLD cards before
       * Angular updates the DOM.
       */
      this.captureCurrentPositions();

      const oldFirst = previous[0];
      const oldSecond = previous[1];

      const newFirst = current[0];
      const newSecond = current[1];

      /*
       * CASE 1
       *
       * [A, B] -> [B, C]
       *
       * Neither card was pinned.
       *
       * B moves from position 2 -> position 1.
       */
      if (
        !oldFirst.pinned &&
        !oldSecond.pinned &&
        newFirst.id === oldSecond.id
      ) {
        this.animationType = 'queue';
      } else if (
        /*
         * CASE 2
         *
         * [A(P), B] -> [A(P), C]
         */
        oldFirst.pinned &&
        !oldSecond.pinned &&
        newFirst.id === oldFirst.id
      ) {
        this.animationType = 'replace-second';
      } else if (
        /*
         * CASE 3
         *
         * [A, B(P)] -> [C, B(P)]
         */
        !oldFirst.pinned &&
        oldSecond.pinned &&
        newSecond.id === oldSecond.id
      ) {
        this.animationType = 'replace-first';
      } else {
        this.animationType = 'none';
      }

      this.animationPending = true;
    }

    this.previousLaps = [...current];
  }

  private captureCurrentPositions(): void {
    this.previousRects.clear();

    this.lapCards?.forEach((cardElement) => {
      const element = cardElement.nativeElement;
      const id = element.dataset['lapId'];

      if (id) {
        this.previousRects.set(id, element.getBoundingClientRect());
      }
    });
  }

  ngAfterViewChecked(): void {
    if (!this.animationPending) {
      return;
    }

    this.animationPending = false;

    /*
     * Wait until Angular has finished rendering the new cards.
     */
    requestAnimationFrame(() => {
      this.runFlipAnimation();
    });
  }

  private runFlipAnimation(): void {
    if (this.animationType === 'none') {
      this.previousRects.clear();
      return;
    }

    this.lapCards.forEach((cardElement) => {
      const element = cardElement.nativeElement;
      const id = element.dataset['lapId'];

      if (!id) {
        return;
      }

      const oldRect = this.previousRects.get(id);
      const newRect = element.getBoundingClientRect();

      /*
       * Existing card.
       *
       * Calculate how far it moved.
       */
      if (oldRect) {
        const deltaX = oldRect.left - newRect.left;
        const deltaY = oldRect.top - newRect.top;

        /*
         * No movement.
         */
        if (deltaX === 0 && deltaY === 0) {
          return;
        }

        /*
         * FLIP:
         *
         * First -> Last -> Invert -> Play
         */
        element.animate(
          [
            {
              transform: `translate(${deltaX}px, ${deltaY}px)`,
            },
            {
              transform: 'translate(0, 0)',
            },
          ],
          {
            duration: 420,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
          },
        );

        return;
      }

      /*
       * New card.
       *
       * Fade it into its new position.
       */
      element.animate(
        [
          {
            opacity: 0,
            transform: this.isMobile()
              ? 'translateY(24px)'
              : 'translateX(24px)',
          },
          {
            opacity: 1,
            transform: 'translate(0, 0)',
          },
        ],
        {
          duration: 320,
          easing: 'ease-out',
          fill: 'both',
        },
      );
    });

    this.previousRects.clear();
    this.animationType = 'none';
  }

  private isMobile(): boolean {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  formatLapTime(time: number | null): string {
    if (time == null) {
      return '--';
    }

    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
  }

  formatSectorTime(time: number | null): string {
    if (time == null) {
      return '--.---';
    }

    if (time >= 60) {
      return this.formatLapTime(time);
    }

    return time.toFixed(3);
  }

  isSessionBest(card: SelectedLap): boolean {
    return (
      card.driver.driver === this.race.sessionFastestDriver &&
      card.lap.lapNumber === this.race.sessionFastestLap
    );
  }

  getTeamLogo(team: string): string {
    return 'assets/team-logos/' + this.normalizeTeamName(team) + '.svg';
  }

  getTeamLogoClass(team: string): string {
    return this.normalizeTeamName(team);
  }

  // private normalizeTeamName(team: string): string {
  //   return 'plcholder';
  // }

  private normalizeTeamName(team: string): string {
    if (team === 'Red Bull Racing') return 'redbull';
    if (team === 'Red Bull') return 'redbull';
    if (team === 'Mercedes') return 'mercedes';
    if (team === 'Ferrari') return 'ferrari';
    if (team === 'McLaren') return 'mclaren';
    if (team === 'Toro Rosso') return 'tororosso';
    if (team === 'AlphaTauri') return 'alphatauri';
    if (team === 'Alfa Romeo' || team === 'Alfa Romeo Racing')
      return 'alfaromeo';
    if (team === 'Alpine' || team === 'Alpine F1 Team') return 'alpine';
    if (team === 'Aston Martin') return 'astonmartin';
    if (team === 'Force India') return 'forceindia';
    if (team === 'Racing Point') return 'racingpoint';
    if (team === 'Williams') return 'williams';
    if (team === 'RB' || team === 'Racing Bulls') return 'racingbulls';
    if (team === 'Kick Sauber') return 'kicksauber';
    if (team === 'Sauber') return 'alfaromeo';
    if (team === 'Renault') return 'renault';
    if (team === 'Haas F1 Team') return 'haas';
    if (team === 'Haas') return 'haas';
    if (team === 'Audi') return 'audi';
    if (team === 'Cadillac') return 'cadillac';

    return 'plcholder';
  }

  onTeamLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;

    img.src = 'assets/team-logos/plcholder.svg';
    img.className = 'plcholder';
  }

  getCompoundColor(compound: string): string {
    switch (compound.toUpperCase()) {
      case 'SOFT':
        return '#ff2b2b';

      case 'MEDIUM':
        return '#ffd400';

      case 'HARD':
        return '#dfdfdf';

      case 'INTERMEDIATE':
        return '#3cff00';

      case 'WET':
        return '#0066ff';

      default:
        return '#ffffff';
    }
  }
}
