import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Subscription } from 'rxjs';

import {
  FastestLapService,
  FastestLapData,
} from '../../../core/services/fastest-lap.service';
import { DriverMetaService } from '../../../core/services/driver-meta.service';

@Component({
  selector: 'app-fastest-lap-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fastest-lap-banner.component.html',
  styleUrls: ['./fastest-lap-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FastestLapBannerComponent implements OnInit {
  fastestLap: FastestLapData | null = null;

  private sub?: Subscription;

  constructor(
    private fastestLapService: FastestLapService,
    private driverMeta: DriverMetaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.sub = this.fastestLapService.fastestLapData$.subscribe(
      (data: FastestLapData | null) => {
        this.fastestLap = data;

        this.cdr.markForCheck();
      },
    );
  }

  get teamLogo(): string {
    if (!this.fastestLap) {
      return '';
    }

    const team = this.driverMeta.getTeamByDriverCode(this.fastestLap.driver);

    return 'assets/team-logos/' + team + '.svg';
  }

  get teamColor(): string {
    if (!this.fastestLap) {
      return '#d77cff';
    }

    return this.driverMeta.get(this.fastestLap.driver)?.color ?? '#d77cff';
  }

  onTeamLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;

    img.src = 'assets/team-logos/plcholder.svg';

    img.className = 'plcholder';
  }

  get teamLogoClass(): string {
    if (!this.fastestLap) {
      return '';
    }

    return this.fastestLap.team.toLowerCase().replace(/\s/g, '');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
