import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'fliptrack' = 'md';
  @Input() disabled = false;

  @Input() active = false;

  pressed = false;

  @Output() clicked = new EventEmitter<void>();

  onClick(event: MouseEvent): void {
    this.clicked.emit();

    // Only for touch devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      (event.currentTarget as HTMLButtonElement).blur();
    }
  }

  onPointerDown(): void {
    if (window.matchMedia('(pointer: coarse)').matches) {
      this.pressed = true;
    }
  }

  onPointerUp(): void {
    this.pressed = false;
  }
}
