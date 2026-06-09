import { Component, EventEmitter, Input, Output } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-track-map-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './track-map-header.component.html',
  styleUrl: './track-map-header.component.scss',
})
export class TrackMapHeaderComponent {
  @Input() trackInfo: any = null;

  @Input() eventYear!: number;

  @Input() localRaceTime = '';

  @Output() flipTrack = new EventEmitter<void>();
}
