import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  BootstrapFailureType,
  BootstrapStep,
} from '../../core/services/simulation-bootstrap.service';

@Component({
  selector: 'app-bootstrap-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bootstrap-loading-overlay.component.html',
  styleUrls: ['./bootstrap-loading-overlay.component.scss'],
})
export class BootstrapLoadingOverlayComponent {
  @Input() raceName = '';

  @Input() steps: BootstrapStep[] = [];

  @Input()
  failureType: BootstrapFailureType = 'none';

  @Output()
  retry = new EventEmitter<void>();

  @Output()
  continueAnyway = new EventEmitter<void>();

  @Output()
  tryAnotherRace = new EventEmitter<void>();
}
