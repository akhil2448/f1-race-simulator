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
      console.log(this.response.drivers[2].stints);

      this.raceContext.raceManagementDrivers = response;

      this.raceContext.save();
    } catch (e) {
      console.error(e);

      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  ////////////////////////////////////////////////////////////

  selectDriver(driver: RaceManagementDriver): void {
    console.log(driver);
  }
}
