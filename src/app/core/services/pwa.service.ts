import { computed, Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;

  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  private static readonly DISMISS_KEY = 'pitwall-install-dismissed';
  private static readonly DISMISS_DAYS = 7;

  private readonly _canInstall = signal(false);
  private readonly _isInstalled = signal(this.detectInstalled());

  readonly canInstall = this._canInstall.asReadonly();
  readonly isInstalled = this._isInstalled.asReadonly();

  readonly shouldShowInstallButton = computed(() => {
    return !this.isInstalled();
  });

  readonly shouldPromptOnExplore = computed(() => {
    if (this.isInstalled()) {
      return false;
    }

    const stored = localStorage.getItem(PwaService.DISMISS_KEY);

    if (!stored) {
      return true;
    }

    const dismissedAt = Number(stored);

    const sevenDays = PwaService.DISMISS_DAYS * 24 * 60 * 60 * 1000;

    return Date.now() - dismissedAt >= sevenDays;
  });

  constructor() {
    this.registerEvents();
  }

  private registerEvents(): void {
    // console.log('Registering PWA event listeners...');

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      //   console.log('✅ beforeinstallprompt fired');

      event.preventDefault();

      this.deferredPrompt = event as BeforeInstallPromptEvent;

      this._canInstall.set(true);

      //   console.log('canInstall =', this.canInstall());
    });

    window.addEventListener('appinstalled', () => {
      //   console.log('✅ appinstalled fired');

      this.deferredPrompt = null;

      this._canInstall.set(false);

      this._isInstalled.set(true);
    });
  }

  private isStandaloneMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  private isIOSStandalone(): boolean {
    return (window.navigator as NavigatorWithStandalone).standalone === true;
  }

  private detectInstalled(): boolean {
    return this.isStandaloneMode() || this.isIOSStandalone();
  }
  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    await this.deferredPrompt.prompt();

    const result = await this.deferredPrompt.userChoice;

    this.deferredPrompt = null;

    this._canInstall.set(false);

    if (result.outcome === 'accepted') {
      this._isInstalled.set(true);
      return true;
    }

    return false;
  }


  dismissForNow(): void {
    localStorage.setItem(PwaService.DISMISS_KEY, Date.now().toString());
  }

 
}
