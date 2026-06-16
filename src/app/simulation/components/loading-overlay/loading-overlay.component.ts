import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { LoadingOverlayService } from '../../../core/services/loading-overlay.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.scss',
})
export class LoadingOverlayComponent {
  constructor(public overlay: LoadingOverlayService) {}
}
