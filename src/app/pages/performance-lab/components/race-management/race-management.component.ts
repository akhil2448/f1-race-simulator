import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { RaceContextService } from '../../../../core/services/race-context.service';
import {
  RaceManagementDriver,
  RaceManagementDriversResponse,
} from '../../models/performance-lab.model';
import { RaceManagementService } from '../../services/race-management.service';
import { RaceManagementDriverRowComponent } from './race-management-driver-row/race-management-driver-row.component';
import { RaceManagementRecommendationsComponent } from './race-management-recommendations/race-management-recommendations.component';
import { TeamUiService } from '../../services/team-ui.service';

@Component({
  selector: 'app-race-management',
  standalone: true,
  imports: [
    CommonModule,
    RaceManagementDriverRowComponent,
    RaceManagementRecommendationsComponent,
  ],
  templateUrl: './race-management.component.html',
  styleUrl: './race-management.component.scss',
})
export class RaceManagementComponent implements OnInit {
  private readonly raceContext = inject(RaceContextService);

  private readonly raceManagementService = inject(RaceManagementService);
  private readonly teamUi = inject(TeamUiService);

  loading = true;

  error = false;

  showRecommendations = false;

  response: RaceManagementDriversResponse | null = null;

  async ngOnInit(): Promise<void> {
    //
    // Already cached
    //
    const cached = this.raceContext.raceManagementDrivers;

    if (
      cached &&
      cached.year === this.raceContext.selectedYear &&
      cached.round === this.raceContext.selectedRound
    ) {
      this.response = cached;
      this.loading = false;

      return;
    }

    await this.load();
  }

  ////////////////////////////////////////////////////////////

  private async load(): Promise<void> {
    try {
      this.loading = true;

      this.error = false;

      const response = await firstValueFrom(
        this.raceManagementService.getDrivers(
          this.raceContext.selectedYear!,
          this.raceContext.selectedRound!,
        ),
      );

      this.response = response;

      this.raceContext.raceManagementDrivers = response;

      this.raceContext.save();
    } catch (e) {
      console.error(e);

      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  tyreClass(compound: string): string {
    return compound.toLowerCase();
  }

  compoundLabel(compound: string): string {
    switch (compound) {
      case 'INTERMEDIATE':
        return 'INTER';

      default:
        return compound;
    }
  }

  get activeDrivers(): RaceManagementDriver[] {
    return this.displayedDrivers.filter((driver) => driver.lapsCompleted > 0);
  }

  get nonStarters(): RaceManagementDriver[] {
    return (
      this.response?.drivers.filter((driver) => driver.lapsCompleted === 0) ??
      []
    );
  }

  getTeamLogo(team: string): string {
    return this.teamUi.getTeamLogo(team);
  }

  getTeamLogoClass(team: string): string {
    return this.teamUi.getTeamLogoClass(team);
  }

  normalizeColor(color: string): string {
    return this.teamUi.normalizeColor(color);
  }

  getTextColor(background: string): string {
    return this.teamUi.getTextColor(background);
  }

  onTeamLogoError(event: Event): void {
    this.teamUi.onTeamLogoError(event);
  }

  ////////////////////////////////////////////////////////////

  selectDriver(driver: RaceManagementDriver): void {
    const selected = this.raceContext.raceManagementSelectedDriverCodes;

    //
    // Already selected -> remove it.
    //
    const index = selected.indexOf(driver.driverCode);

    if (index >= 0) {
      selected.splice(index, 1);

      this.raceContext.save();

      return;
    }

    //
    // First driver.
    //
    if (selected.length === 0) {
      selected.push(driver.driverCode);

      this.raceContext.save();

      return;
    }

    //
    // Second driver.
    //
    if (selected.length === 1) {
      selected.push(driver.driverCode);

      this.raceContext.save();

      return;
    }

    //
    // Already two drivers.
    // Replace only the second one.
    //
    selected[1] = driver.driverCode;

    this.raceContext.save();
  }

  isSelected(driver: RaceManagementDriver): boolean {
    return this.raceContext.raceManagementSelectedDriverCodes.includes(
      driver.driverCode,
    );
  }

  get selectedDriverCodes(): string[] {
    return this.raceContext.raceManagementSelectedDriverCodes;
  }

  get hasSelectedDrivers(): boolean {
    return this.selectedDriverCodes.length > 0;
  }

  get primaryDriver(): string {
    return this.selectedDriverCodes[0] ?? '';
  }

  get secondaryDriver(): string {
    return this.selectedDriverCodes[1] ?? '';
  }

  getTeamColor(driverCode: string): string {
    return (
      '#' +
      this.response!.drivers.find((d) => d.driverCode === driverCode)!.teamColor
    );
  }

  get displayedDrivers(): RaceManagementDriver[] {
    if (!this.response) {
      return [];
    }

    if (!this.showRecommendations) {
      return this.response.drivers;
    }

    return this.response.drivers.filter((driver) =>
      this.selectedDriverCodes.includes(driver.driverCode),
    );
  }

  generateRecommendations(): void {
    if (this.selectedDriverCodes.length === 0) {
      return;
    }

    this.showRecommendations = true;
  }

  changeSelection(): void {
    this.showRecommendations = false;

    this.raceContext.raceManagementSelectedDriverCodes = [];

    this.raceContext.save();
  }
}
