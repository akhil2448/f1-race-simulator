import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriverLap } from '../../../core/models/qualifying-comparison.model';

@Component({
  selector: 'app-driver-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './driver-card.component.html',
  styleUrl: './driver-card.component.scss',
})
export class DriverCardComponent {
  @Input({ required: true })
  driver!: DriverLap;

  @Input({ required: true })
  progress = 0;

  @Input()
  gap: number | null = null;

  get elapsedTime(): number {
    return Math.min(this.driver.lapTime * this.progress, this.driver.lapTime);
  }

  get lapTimer(): string {
    return this.formatTime(this.elapsedTime);
  }

  get showSector1(): boolean {
    return this.elapsedTime >= this.driver.sector1;
  }

  get showSector2(): boolean {
    return this.elapsedTime >= this.driver.sector1 + this.driver.sector2;
  }

  get showSector3(): boolean {
    return this.elapsedTime >= this.driver.lapTime;
  }

  get teamColour(): string {
    return `#${this.driver.teamColor}`;
  }

  get teamLogo(): string {
    return (
      'assets/team-logos/' +
      this.driver.teamName.toLowerCase().replace(/\s+/g, '') +
      '.svg'
    );
  }

  get formattedGap(): string {
    if (this.gap == null) {
      return '';
    }

    const sign = this.gap >= 0 ? '+' : '-';

    return `${sign}${Math.abs(this.gap).toFixed(3)}`;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
  }

  formatSector(time: number): string {
    return time.toFixed(3);
  }

  getTeamLogo(team: string): string {
    return 'assets/team-logos/' + this.normalizeTeamName(team) + '.svg';
  }

  getTeamLogoClass(team: string): string {
    return this.normalizeTeamName(team);
  }

  //   private normalizeTeamName(team: string): string {
  //     return 'williams';
  //   }

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

    if (team === 'Sauber') return 'sauber';

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
}
