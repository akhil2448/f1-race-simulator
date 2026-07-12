import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RaceManagementDriver } from '../../../models/performance-lab.model';

@Component({
  selector: 'app-race-management-driver-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-management-driver-row.component.html',
  styleUrl: './race-management-driver-row.component.scss',
})
export class RaceManagementDriverRowComponent {
  @Input({ required: true })
  driver!: RaceManagementDriver;

  @Input({ required: true })
  totalRaceLaps!: number;

  @Input()
  selected = false;

  @Output()
  driverSelected = new EventEmitter<RaceManagementDriver>();

  selectDriver(): void {
    this.driverSelected.emit(this.driver);
  }

  stintWidth(lapCount: number): number {
    return (lapCount / this.totalRaceLaps) * 100;
  }

  tyreClass(compound: string): string {
    return compound.toLowerCase();
  }

  isLast(index: number): boolean {
    return index === this.driver.stints.length - 1;
  }

  getTextColor(background: string): string {
    const hex = background.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 120 ? '#111111' : '#FFFFFF';
  }

  normalizeColor(color: string): string {
    return color.startsWith('#') ? color : `#${color}`;
  }

  getTeamLogo(team: string): string {
    return 'assets/team-logos/' + this.normalizeTeamName(team) + '.svg';
  }

  getTeamLogoClass(team: string): string {
    return this.normalizeTeamName(team);
  }

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
}
