import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-support-button',
  standalone: true,
  templateUrl: './support-button.component.html',
  styleUrls: ['./support-button.component.scss'],
})
export class SupportButtonComponent {
  @Input() text = 'Support Me';

  buyMeCoffeeUrl = 'https://buymeacoffee.com/pitwallf1';

  @Input() size: 'normal' | 'compact' = 'normal';

  openSupportPage(): void {
    window.open(this.buyMeCoffeeUrl, '_blank', 'noopener,noreferrer');
  }
}
