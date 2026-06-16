import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RedFlagMetadata } from '../../../core/models/race-data.model';

import { SeekCoordinatorService } from '../../../core/services/seek-coordinator.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { RaceLocalTimeService } from '../../../core/services/race-local-time.service';

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

  constructor(
    private seekCoordinator: SeekCoordinatorService,
    private raceLocalTime: RaceLocalTimeService,
  ) {}

  async seekToRestart(): Promise<void> {
    await this.seekCoordinator.seekToRaceSecond(
      this.redFlag.restart.resumeRaceSecond,
    );

    window.dispatchEvent(new CustomEvent('replay-seek-complete'));
  }

  get restartLap(): number {
    return this.redFlag.restart.lap;
  }

  get restartLocalTime(): string {
    const date = this.raceLocalTime.getLocalTimeForRaceSecond(
      this.redFlag.restart.resumeRaceSecond,
    );

    if (!date) {
      return '--:--:--';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }
}
