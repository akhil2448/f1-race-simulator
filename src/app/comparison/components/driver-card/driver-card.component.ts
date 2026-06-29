import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DriverLap } from '../../../core/models/qualifying-comparison.model';
import { SectorDisplay } from '../../models/sector-display.model';

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

  @Input()
  sector1!: SectorDisplay;

  @Input()
  sector2!: SectorDisplay;

  @Input()
  sector3!: SectorDisplay;

  get elapsedTime(): number {
    return Math.min(this.driver.lapTime * this.progress, this.driver.lapTime);
  }

  get lapTimer(): string {
    return this.formatTime(this.elapsedTime);
  }

  get currentSector(): 1 | 2 | 3 {
    if (this.elapsedTime < this.driver.sector1) {
      return 1;
    }

    if (this.elapsedTime < this.driver.sector1 + this.driver.sector2) {
      return 2;
    }

    return 3;
  }

  get sector1Display(): string {
    if (this.sector1?.text !== null) {
      return this.sector1.text!;
    }

    if (this.currentSector === 1) {
      return this.formatSector(this.elapsedTime);
    }

    return this.formatSector(this.driver.sector1);
  }

  get sector2Display(): string {
    if (this.sector2?.text !== null) {
      return this.sector2.text!;
    }

    if (this.currentSector === 1) {
      return '--.---';
    }

    if (this.currentSector === 2) {
      return this.formatSector(this.elapsedTime - this.driver.sector1);
    }

    return this.formatSector(this.driver.sector2);
  }

  get sector3Display(): string {
    if (this.sector3?.text !== null) {
      return this.sector3.text!;
    }

    if (this.currentSector !== 3) {
      return '--.---';
    }

    if (this.elapsedTime < this.driver.lapTime) {
      return this.formatSector(
        this.elapsedTime - this.driver.sector1 - this.driver.sector2,
      );
    }

    return this.formatSector(this.driver.sector3);
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
