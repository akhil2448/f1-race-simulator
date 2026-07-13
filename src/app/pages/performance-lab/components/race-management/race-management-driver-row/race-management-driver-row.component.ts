import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { RaceManagementDriver } from '../../../models/performance-lab.model';
import { TeamUiService } from '../../../services/team-ui.service';

@Component({
  selector: 'app-race-management-driver-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-management-driver-row.component.html',
  styleUrl: './race-management-driver-row.component.scss',
})
export class RaceManagementDriverRowComponent {
  private readonly teamUi = inject(TeamUiService);

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
    return this.teamUi.getTextColor(background);
  }

  normalizeColor(color: string): string {
    return this.teamUi.normalizeColor(color);
  }

  getTeamLogo(team: string): string {
    return this.teamUi.getTeamLogo(team);
  }

  getTeamLogoClass(team: string): string {
    return this.teamUi.getTeamLogoClass(team);
  }

  onTeamLogoError(event: Event): void {
    this.teamUi.onTeamLogoError(event);
  }
}
