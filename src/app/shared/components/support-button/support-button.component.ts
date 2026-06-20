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

  @Input() buyMeCoffeeUrl = 'https://buymeacoffee.com/YOUR_PAGE';

  openSupportPage(): void {
    window.open(this.buyMeCoffeeUrl, '_blank', 'noopener,noreferrer');
  }
}
