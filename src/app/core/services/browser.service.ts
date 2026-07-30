import { Injectable } from '@angular/core';

export enum BrowserType {
  ChromeDesktop = 'Chrome Desktop',
  ChromeAndroid = 'Chrome Android',
  Edge = 'Microsoft Edge',
  SafariMac = 'Safari macOS',
  SafariIOS = 'Safari iOS',
  Firefox = 'Firefox',
  SamsungInternet = 'Samsung Internet',
  Unknown = 'Unknown',
}

@Injectable({
  providedIn: 'root',
})
export class BrowserService {
  getBrowser(): BrowserType {
    const ua = navigator.userAgent;

    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isAndroid = /Android/i.test(ua);

    if (/SamsungBrowser/i.test(ua)) {
      return BrowserType.SamsungInternet;
    }

    if (/Edg/i.test(ua)) {
      return BrowserType.Edge;
    }

    if (/Firefox/i.test(ua)) {
      return BrowserType.Firefox;
    }

    if (isIOS) {
      return BrowserType.SafariIOS;
    }

    const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);

    if (isSafari) {
      return BrowserType.SafariMac;
    }

    if (/Chrome/i.test(ua)) {
      return isAndroid ? BrowserType.ChromeAndroid : BrowserType.ChromeDesktop;
    }

    return BrowserType.Unknown;
  }

  isMobile(): boolean {
    return (
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      navigator.maxTouchPoints > 1
    );
  }

  isDesktop(): boolean {
    return !this.isMobile();
  }
}
