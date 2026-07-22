import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  BootstrapFailureType,
  BootstrapStep,
} from '../../core/services/simulation-bootstrap.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-bootstrap-loading-overlay',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './bootstrap-loading-overlay.component.html',
  styleUrls: ['./bootstrap-loading-overlay.component.scss'],
})
export class BootstrapLoadingOverlayComponent {
  @Input() raceName = '';

  @Input() steps: BootstrapStep[] = [];

  @Input()
  failureType: BootstrapFailureType = 'none';

  @Input()
  showTelemetryHelper = false;

  @Output()
  retry = new EventEmitter<void>();

  @Output()
  continueAnyway = new EventEmitter<void>();

  @Output()
  tryAnotherRace = new EventEmitter<void>();
}
