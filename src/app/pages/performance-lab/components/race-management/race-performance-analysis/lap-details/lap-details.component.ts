import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
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
export class LapDetailsComponent {
  @Input({ required: true })
  selectedLaps: SelectedLap[] = [];

  @Input({ required: true })
  race!: RaceInfo;

  @Output()
  remove = new EventEmitter<string>();
  @Output()
  togglePin = new EventEmitter<string>();

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
