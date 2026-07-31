import {
  Component,
  computed,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BrowserService,
  BrowserType,
} from '../../../core/services/browser.service';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-install-pitwall-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './install-pitwall-dialog.component.html',
  styleUrl: './install-pitwall-dialog.component.scss',
})
export class InstallPitwallDialogComponent {
  protected readonly BrowserType = BrowserType;

  private readonly browserService = inject(BrowserService);
  private readonly pwaService = inject(PwaService);

  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() maybeLater = new EventEmitter<void>();

  readonly browser = this.browserService.getBrowser();

  readonly canInstall = this.pwaService.canInstall;

  readonly runningAsPwa = this.pwaService.runningAsPwa;

  readonly supportsNativeInstall = computed(() => {
    if (this.runningAsPwa()) {
      return false;
    }

    return (
      this.browser === BrowserType.ChromeDesktop ||
      this.browser === BrowserType.ChromeAndroid ||
      this.browser === BrowserType.Edge
    );
  });

  async install(): Promise<void> {
    const installed = await this.pwaService.install();

    if (installed) {
      this.close();
    }
  }
  close(): void {
    this.closed.emit();
  }

  continueWithoutInstalling(): void {
    this.maybeLater.emit();
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }
}
