import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingOverlayService } from '../../core/services/loading-overlay.service';
import { DriverSelectionComponent } from './components/ driver-selection/driver-selection.component';
import { RaceContextService } from '../../core/services/race-context.service';
import { RaceManagementComponent } from './components/race-management/race-management.component';

type AnalysisMode = 'ultimate' | 'race';

@Component({
  selector: 'app-performance-lab',
  standalone: true,
  imports: [CommonModule, DriverSelectionComponent, RaceManagementComponent],
  templateUrl: './performance-lab.component.html',
  styleUrl: './performance-lab.component.scss',
})
export class PerformanceLabComponent {
  mode: AnalysisMode = 'ultimate';

  private readonly overlay = inject(LoadingOverlayService);
  private readonly raceContext = inject(RaceContextService);

  private readonly router = inject(Router);

  private readonly MIN_BACK_LOADING_MS = 1000;

  readonly selectedYear = this.raceContext.selectedYear!;
  readonly selectedRace = this.raceContext.selectedRace!;

  toggleMode(mode: AnalysisMode): void {
    this.mode = mode;
  }

  async goBack(): Promise<void> {
    this.overlay.show('Returning to Race Selection...');

    const startTime = Date.now();

    try {
      const elapsed = Date.now() - startTime;

      const remaining = Math.max(0, this.MIN_BACK_LOADING_MS - elapsed);

      await this.delay(remaining);

      this.raceContext.clearPerformanceLab();

      this.raceContext.navigationStep = 'race-selection';

      await this.router.navigate(['/select-race']);
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
