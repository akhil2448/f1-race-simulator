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
  private readonly _runningAsPwa = signal(false);

  readonly canInstall = this._canInstall.asReadonly();
  readonly runningAsPwa = this._runningAsPwa.asReadonly();

  readonly shouldShowInstallButton = computed(() => {
    return !this.runningAsPwa();
  });

  readonly shouldPromptOnExplore = computed(() => {
    if (this.runningAsPwa()) {
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

  readonly shouldShowInstallDialog = computed(() => {
    if (!this.shouldPromptOnExplore()) {
      return false;
    }

    // Chrome/Edge
    if (this.canInstall()) {
      return true;
    }

    // Safari instructions are still useful
    return false;
  });

  constructor() {
    this._runningAsPwa.set(this.detectRunningAsPwa());

    this.registerEvents();

    this.watchDisplayMode();
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

      this._runningAsPwa.set(true);
    });
  }

  private watchDisplayMode(): void {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const update = () => {
      this._runningAsPwa.set(this.detectRunningAsPwa());
    };

    update();

    mediaQuery.addEventListener('change', update);

    window.addEventListener('pageshow', update);

    window.addEventListener('focus', update);

    document.addEventListener('visibilitychange', update);
  }

  private isDisplayModeStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  private isIOSHomeScreen(): boolean {
    return (window.navigator as NavigatorWithStandalone).standalone === true;
  }

  private detectRunningAsPwa(): boolean {
    return this.isDisplayModeStandalone() || this.isIOSHomeScreen();
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
      this._runningAsPwa.set(true);
      return true;
    }

    return false;
  }

  dismissForNow(): void {
    localStorage.setItem(PwaService.DISMISS_KEY, Date.now().toString());
  }
}
