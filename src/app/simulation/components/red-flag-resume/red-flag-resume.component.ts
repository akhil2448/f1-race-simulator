import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RedFlagMetadata } from '../../../core/models/race-data.model';

import { SeekCoordinatorService } from '../../../core/services/seek-coordinator.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-red-flag-resume',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './red-flag-resume.component.html',
  styleUrls: ['./red-flag-resume.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedFlagResumeComponent {
  @Input() redFlag!: RedFlagMetadata;

  constructor(private seekCoordinator: SeekCoordinatorService) {}

  seekToRestart(): void {
    this.seekCoordinator.seekToRaceSecond(
      this.redFlag.restart.resumeRaceSecond,
    );
  }

  get restartLap(): number {
    return this.redFlag.restart.lap;
  }
}
