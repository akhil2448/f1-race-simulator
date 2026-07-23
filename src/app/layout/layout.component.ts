import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  currentUrl = '';

  private readonly MOBILE_BREAKPOINT = 1024;

  constructor(private router: Router) {
    this.currentUrl = this.router.url;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl = this.router.url;
      });
  }

  isMobileDevice(): boolean {
    return window.innerWidth <= this.MOBILE_BREAKPOINT;
  }

  showFooter(): boolean {
    // Desktop: always show footer (current behavior)
    if (!this.isMobileDevice()) {
      return true;
    }

    // Mobile: hide footer on workspace pages
    return !(
      this.currentUrl === '/simulation' ||
      this.currentUrl.startsWith('/qualifying') ||
      this.currentUrl === '/qualifying-comparison' ||
      this.currentUrl === '/race-comparison'
    );
  }
}
