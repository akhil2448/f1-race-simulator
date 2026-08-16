import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { CommonModule } from '@angular/common';

import { SelectedLap } from '../../../../models/lap-details.model';

@Component({
  selector: 'app-lap-details',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './lap-details.component.html',
  styleUrls: ['./lap-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LapDetailsComponent {
  @Input({ required: true })
  selectedLaps: SelectedLap[] = [];

  @Output()
  remove = new EventEmitter<string>();
  @Output()
  togglePin = new EventEmitter<string>();

  getTeamLogo(team: string): string {
    return `assets/team-logos/${team.toLowerCase().replace(/ /g, '-')}.svg`;
  }

  formatLapTime(time: number | null): string {
    if (time == null) {
      return '--';
    }

    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
  }
}
