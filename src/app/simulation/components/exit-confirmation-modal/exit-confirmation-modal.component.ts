import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-exit-confirmation-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './exit-confirmation-modal.component.html',
  styleUrls: ['./exit-confirmation-modal.component.scss'],
})
export class ExitConfirmationModalComponent {
  @Input() visible = false;

  @Output() confirm = new EventEmitter<void>();

  @Output() cancel = new EventEmitter<void>();
}
