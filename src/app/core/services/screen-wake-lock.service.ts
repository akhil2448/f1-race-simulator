// screen-wake-lock.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScreenWakeLockService {
  private wakeLock: WakeLockSentinel | null = null;
  private enabled = false;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.enabled) {
        this.requestWakeLock();
      }
    });
  }

  async enable(): Promise<void> {
    this.enabled = true;
    await this.requestWakeLock();
  }

  async disable(): Promise<void> {
    this.enabled = false;

    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('🔒 Screen wake lock released');
    }
  }

  private async requestWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock API not supported');
      return;
    }

    if (this.wakeLock) return;

    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      this.wakeLock = lock;

      console.log('🔓 Screen wake lock active');

      lock.addEventListener('release', () => {
        console.log('🔒 Screen wake lock released');
        this.wakeLock = null;
      });
    } catch (err) {
      console.error('Wake lock failed:', err);
    }
  }
}
