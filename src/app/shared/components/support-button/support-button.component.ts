import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-support-button',
  standalone: true,
  templateUrl: './support-button.component.html',
  styleUrls: ['./support-button.component.scss'],
})
export class SupportButtonComponent {
  @Input() text = 'Support Me';
  @Input() size: 'normal' | 'compact' | 'trackmap-header' = 'normal';

  buyMeCoffeeUrl = 'https://buymeacoffee.com/pitwallf1';

  isClicked = false;
  hoverSuppressed = false;

  onPointerEnter(): void {
    this.hoverSuppressed = false;
  }

  onPointerLeave(): void {
    this.hoverSuppressed = false;
  }

  openSupportPage(): void {
    this.isClicked = true;

    setTimeout(() => {
      this.isClicked = false;
      this.hoverSuppressed = true;

      window.open(this.buyMeCoffeeUrl, '_blank', 'noopener,noreferrer');
    }, 100);
  }
}
