import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-pinned-selection-modal',
  standalone: true,
  templateUrl: './pinned-selection-modal.component.html',
  styleUrls: ['./pinned-selection-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinnedSelectionModalComponent {
  @Output()
  close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
