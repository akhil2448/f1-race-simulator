import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { inject } from '@angular/core';
import { RaceContextService } from '../../../../core/services/race-context.service';
import { DriverSelectionDriver } from '../../models/performance-lab.model';
import { QualifyingComparisonService } from '../../../../core/services/qualifying-comparison.service';
import { LoadingOverlayService } from '../../../../core/services/loading-overlay.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TeamUiService } from '../../services/team-ui.service';

@Component({
  selector: 'app-driver-selection',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent],
  templateUrl: './driver-selection.component.html',
  styleUrl: './driver-selection.component.scss',
})
export class DriverSelectionComponent {
  private readonly raceContext = inject(RaceContextService);
  private readonly comparisonService = inject(QualifyingComparisonService);
  private readonly overlay = inject(LoadingOverlayService);
  private readonly router = inject(Router);
  private readonly teamUi = inject(TeamUiService);

  private readonly MIN_LOADING_MS = 2000;
  private readonly MAX_RETRIES = 3;

  readonly sessions: ('Q1' | 'Q2' | 'Q3')[] = ['Q3', 'Q2', 'Q1'];

  get selectedSession(): 'Q1' | 'Q2' | 'Q3' {
    return this.raceContext.selectedSession;
  }

  set selectedSession(value: 'Q1' | 'Q2' | 'Q3') {
    this.raceContext.selectedSession = value;
  }

  readonly selectedYear = this.raceContext.selectedYear!;

  readonly selectedRace = this.raceContext.selectedRace!;

  get selectedDrivers(): DriverSelectionDriver[] {
    return this.raceContext.selectedDrivers;
  }

  showSingleDriverDialog = false;

  // drivers: DriverSelection[] = [
  //   {
  //     code: 'HAM',
  //     lastName: 'Hamilton',
  //     team: 'Mercedes',
  //     teamColor: '#00D2BE',
  //   },
  //   {
  //     code: 'GIO',
  //     lastName: 'Giovinazzi',
  //     team: 'Alfa Romeo',
  //     teamColor: '#9b0000',
  //   },
  //   {
  //     code: 'VER',
  //     lastName: 'Verstappen',
  //     team: 'Red Bull',
  //     teamColor: '#1E41FF',
  //   },
  //   {
  //     code: 'KVY',
  //     lastName: 'Kvyat',
  //     team: 'Toro Rosso',
  //     teamColor: '#469bff',
  //   },
  //   {
  //     code: 'NOR',
  //     lastName: 'Norris',
  //     team: 'McLaren',
  //     teamColor: '#FF8700',
  //   },
  //   {
  //     code: 'OCO',
  //     lastName: 'Ocon',
  //     team: 'Alpine',
  //     teamColor: '#2293d1',
  //   },
  //   {
  //     code: 'LEC',
  //     lastName: 'Leclerc',
  //     team: 'Ferrari',
  //     teamColor: '#DC0000',
  //   },
  //   {
  //     code: 'GAS',
  //     lastName: 'Gasly',
  //     team: 'AlphaTauri',
  //     teamColor: '#4e7c9b',
  //   },
  //   {
  //     code: 'RIC',
  //     lastName: 'Ricciardo',
  //     team: 'Renault',
  //     teamColor: '#FFF500',
  //   },
  //   {
  //     code: 'LAT',
  //     lastName: 'Latifi',
  //     team: 'Williams',
  //     teamColor: '#37bedd',
  //   },
  //   {
  //     code: 'VET',
  //     lastName: 'Vettel',
  //     team: 'Aston Martin',
  //     teamColor: '#2d826d',
  //   },
  //   {
  //     code: 'HUL',
  //     lastName: 'Hulkenberg',
  //     team: 'Audi',
  //     teamColor: '#F50537',
  //   },
  //   {
  //     code: 'BOT',
  //     lastName: 'Bottas',
  //     team: 'Cadillac',
  //     teamColor: '#909090',
  //   },
  //   {
  //     code: 'PER',
  //     lastName: 'Perez',
  //     team: 'Force India',
  //     teamColor: '#F596C8',
  //   },
  //   {
  //     code: 'ZHO',
  //     lastName: 'Zhou',
  //     team: 'Kick Sauber',
  //     teamColor: '#52e252',
  //   },
  //   {
  //     code: 'ERI',
  //     lastName: 'Ericsson',
  //     team: 'Sauber',
  //     teamColor: '#9B0000',
  //   },
  //   {
  //     code: 'MAG',
  //     lastName: 'Magnussen',
  //     team: 'Haas',
  //     teamColor: '#828282',
  //   },
  //   {
  //     code: 'LAW',
  //     lastName: 'Lawson',
  //     team: 'Racing Bulls',
  //     teamColor: '#6C98FF',
  //   },
  //   {
  //     code: 'STR',
  //     lastName: 'Stroll',
  //     team: 'Racing Point',
  //     teamColor: '#f596c8',
  //   },
  //   {
  //     code: 'SPO',
  //     lastName: 'Spool',
  //     team: 'Fake team',
  //     teamColor: '#f596c8',
  //   },
  // ];

  selectSession(session: 'Q1' | 'Q2' | 'Q3') {
    this.selectedSession = session;

    this.raceContext.save();
  }

  get drivers(): DriverSelectionDriver[] {
    const response = this.raceContext.driverSelection;

    if (!response) {
      return [];
    }

    switch (this.selectedSession) {
      case 'Q1':
        return response.sessions.Q1;

      case 'Q2':
        return response.sessions.Q2;

      case 'Q3':
        return response.sessions.Q3;
    }
  }

  selectDriver(driver: DriverSelectionDriver): void {
    //
    // Already selected -> remove it.
    //
    const index = this.selectedDrivers.findIndex(
      (d) => d.driverCode === driver.driverCode,
    );

    if (index >= 0) {
      this.selectedDrivers.splice(index, 1);
      this.raceContext.save();

      return;
    }

    //
    // First driver.
    //
    if (this.selectedDrivers.length === 0) {
      this.selectedDrivers.push(driver);
      this.raceContext.save();

      return;
    }

    //
    // Second driver.
    //
    if (this.selectedDrivers.length === 1) {
      this.selectedDrivers.push(driver);
      this.raceContext.save();

      return;
    }

    //
    // Already two drivers.
    // Replace only the second one.
    //
    this.selectedDrivers[1] = driver;

    this.raceContext.save();
  }

  isSelected(driver: DriverSelectionDriver): boolean {
    return this.selectedDrivers.some((d) => d.driverCode === driver.driverCode);
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

  private async fetchComparisonWithRetry() {
    const driverA = this.selectedDrivers[0]?.driverCode;

    const driverB = this.selectedDrivers[1]?.driverCode;

    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        return await firstValueFrom(
          this.comparisonService.getComparison(
            this.selectedYear,
            this.raceContext.selectedRound!,
            this.selectedSession,
            driverA!,
            driverB ?? '',
          ),
        );
      } catch {
        attempt++;

        if (attempt >= this.MAX_RETRIES) {
          throw new Error();
        }

        this.overlay.show(
          `Connection issue. Retrying (${attempt}/${this.MAX_RETRIES})...`,
        );

        await this.delay(1000);
      }
    }

    throw new Error();
  }

  async continueToTelemetry(): Promise<void> {
    const driverA = this.selectedDrivers[0]?.driverCode;

    if (!driverA) {
      return;
    }

    if (this.selectedDrivers.length === 1) {
      this.showSingleDriverDialog = true;
      return;
    }

    await this.startTelemetryComparison();
  }

  async startTelemetryComparison(): Promise<void> {
    this.showSingleDriverDialog = false;

    this.overlay.show('Loading telemetry comparison...');

    const startTime = Date.now();

    try {
      const response = await this.fetchComparisonWithRetry();

      this.raceContext.comparison = response;

      this.raceContext.save();

      await this.router.navigate(['/qualifying-comparison']);

      const elapsed = Date.now() - startTime;

      const remaining = Math.max(0, this.MIN_LOADING_MS - elapsed);

      await this.delay(remaining);
    } catch (error) {
      console.error(error);
    } finally {
      this.overlay.hide();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
