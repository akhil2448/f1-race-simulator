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

@Component({
  selector: 'app-race-management',
  standalone: true,
  imports: [CommonModule, RaceManagementDriverRowComponent],
  templateUrl: './race-management.component.html',
  styleUrl: './race-management.component.scss',
})
export class RaceManagementComponent implements OnInit {
  private readonly raceContext = inject(RaceContextService);

  private readonly raceManagementService = inject(RaceManagementService);

  loading = true;

  error = false;

  response: RaceManagementDriversResponse | null = null;

  async ngOnInit(): Promise<void> {
    //
    // Already cached
    //
    if (this.raceContext.raceManagementDrivers) {
      this.response = this.raceContext.raceManagementDrivers;
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
}
