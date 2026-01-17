import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackStatusType } from '../../../core/constants/track-status.types';
import { TrackStatusService } from '../../../core/services/track-status.service';

@Component({
  selector: 'app-track-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-status.component.html',
  styleUrl: './track-status.component.scss',
})
export class TrackStatusComponent implements OnInit {
  status: TrackStatusType | null = null;

  constructor(private trackStatus: TrackStatusService) {}

  ngOnInit(): void {
    this.trackStatus.status$.subscribe((s) => {
      this.status = s;
      console.log('TRACK STATUS:', s);
    });
  }

  get statusClass(): string {
    switch (this.status) {
      case 'YELLOW':
        return 'yellow';
      case 'SC':
        return 'sc';
      case 'VSC':
        return 'vsc';
      case 'VSC_ENDING':
        return 'vsc-ending';
      case 'RED':
        return 'red';
      case 'GREEN':
        return 'green';
      default:
        return '';
    }
  }

  get label(): string {
    switch (this.status) {
      case 'YELLOW':
        return 'YELLOW FLAG';
      case 'SC':
        return 'SAFETY CAR';
      case 'VSC':
        return 'VIRTUAL SAFETY CAR';
      case 'VSC_ENDING':
        return 'VSC ENDING';
      case 'RED':
        return 'RED FLAG';
      case 'GREEN':
        return 'GREEN FLAG';
      default:
        return '';
    }
  }
}
