import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TrackMapStateService } from '../../../core/services/track-map-state.service';
import { RaceLocalTimeService } from '../../../core/services/race-local-time.service';
import { TrackInfo } from '../../../core/models/track-data.model';
import { RaceFinishService } from '../../../core/services/race-finish.service';

@Component({
  selector: 'app-track-map-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './track-map-header.component.html',
  styleUrl: './track-map-header.component.scss',
})
export class TrackMapHeaderComponent implements OnInit {
  trackInfo: TrackInfo | null = null;

  eventYear = '';

  localRaceTime = '';

  raceFinished = false;

  constructor(
    private trackState: TrackMapStateService,
    private raceLocalTimeService: RaceLocalTimeService,
    private raceFinish: RaceFinishService,
  ) {}

  ngOnInit(): void {
    this.trackState.trackData$.subscribe((data) => {
      if (!data) return;

      this.trackInfo = data.trackInfo;

      const match = data.trackInfo.officialEventName.match(/\d{4}$/);

      this.eventYear = match ? match[0] : '';
    });

    this.raceLocalTimeService.time$.subscribe((d) => {
      if (!d) return;

      this.localRaceTime = this.formatTime(d);
    });

    this.raceFinish.raceFinished$.subscribe((finished) => {
      this.raceFinished = finished;
    });
  }

  toggleMirror(): void {
    this.trackState.toggleMirror();
  }

  private formatTime(d: Date): string {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
  }
}
