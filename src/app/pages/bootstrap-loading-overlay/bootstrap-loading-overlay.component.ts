import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { BootstrapStep } from '../../core/services/simulation-bootstrap.service';

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
}
