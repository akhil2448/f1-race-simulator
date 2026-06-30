import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent {
  @Input() visible = false;

  @Input() title = '';

  @Input() message = '';

  @Input() confirmText = 'Continue';

  @Input() cancelText = 'Cancel';

  @Output() confirmed = new EventEmitter<void>();

  @Output() cancelled = new EventEmitter<void>();
}
