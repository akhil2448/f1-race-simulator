import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// After worked on leaderboard controls area, come back here to add that area space as padding to the leaderboard.
//The next improvement I'd make is to measure the entire left panel (.left-panel-area)
// instead of just the leaderboard. That way the scaling accounts for everything that needs
// to fit vertically, and you won't have devices where the last 1–3 drivers are clipped.
// That will give a much more robust solution than continuing to tweak constants like 70 or 0.45.
export interface LayoutMetrics {
  scale: number;

  leftPanelWidth: number;

  leaderboardWidth: number;

  sidebarWidth: number;
}

@Injectable({
  providedIn: 'root',
})
export class LayoutScaleService {
  // Desktop reference sizes
  private static readonly DESKTOP_LEFT_PANEL = 445;
  private static readonly DESKTOP_LEADERBOARD = 235;
  private static readonly DESKTOP_SIDEBAR = 210;

  private static readonly MOBILE_CONTROLS_HEIGHT = 70;
  private static readonly MOBILE_MIN_SCALE = 0.45;

  // FOR 20 DRIVERS: 1.1111 & FOR 22 DRIVERS: 1.0437
  private static readonly MOBILE_SCALE_MULTIPLIER = 1.1111;
  // private static readonly MOBILE_SCALE_MULTIPLIER = 1;

  private static readonly MOBILE_LEADERBOARD_PERCENT = 0.48;

  // IMPORTANT:
  // This must always match the desktop transform applied in
  // leaderboard.component.scss:
  //
  // .leaderboard-panel {
  //   transform: scale(0.92);
  // }
  //
  // The measured top-info height uses the layout height,
  // while the user sees the leaderboard rendered at this scale.
  // Keep these values in sync.
  // CHANGED TO 1 TO CHECK IF LEADERBOARD APPEARANCE IMPROVES. IF IT IS STILL 1, DONT CHANGE!
  // PREVIOUS VALUE = 0.92
  private static readonly DESKTOP_LEADERBOARD_SCALE = 0.92;

  // Rendered height of the entire top section (leaderboard + sidebar)
  private desktopTopInfoHeight = 760;

  private driverCount = 20;

  private readonly metricsSubject = new BehaviorSubject<LayoutMetrics>({
    scale: 1,
    leftPanelWidth: LayoutScaleService.DESKTOP_LEFT_PANEL,
    leaderboardWidth: LayoutScaleService.DESKTOP_LEADERBOARD,
    sidebarWidth: LayoutScaleService.DESKTOP_SIDEBAR,
  });

  readonly metrics$ = this.metricsSubject.asObservable();

  constructor() {
    this.update();
  }

  setDesktopTopInfoHeight(height: number): void {
    if (height <= 500) {
      return;
    }

    if (Math.abs(this.desktopTopInfoHeight - height) < 2) {
      return;
    }

    this.desktopTopInfoHeight = height;

    this.update();
  }

  setDriverCount(count: number): void {
    this.driverCount = count;
    this.update();
  }

  update(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Desktop or portrait
    if (width > 1024 || height > width) {
      this.metricsSubject.next({
        scale: 1,
        leftPanelWidth: LayoutScaleService.DESKTOP_LEFT_PANEL,
        leaderboardWidth: LayoutScaleService.DESKTOP_LEADERBOARD,
        sidebarWidth: LayoutScaleService.DESKTOP_SIDEBAR,
      });

      return;
    }

    //---------------------------------------------------------
    // Mobile landscape
    //---------------------------------------------------------

    const aspect = width / height;

    let leftPanelPercent = 0.33;

    if (aspect < 1.45) {
      // Tablets
      leftPanelPercent = 0.38;
    } else if (aspect > 2.0) {
      // Very wide phones
      leftPanelPercent = 0.3;
    }

    const leftPanelWidth = width * leftPanelPercent;

    // Width-based scaling
    const widthScale = leftPanelWidth / LayoutScaleService.DESKTOP_LEFT_PANEL;

    // Height available for the entire left panel
    const availableHeight = height - LayoutScaleService.MOBILE_CONTROLS_HEIGHT;

    // Height scaling based on the rendered top section
    // const heightScale = availableHeight / this.desktopTopInfoHeight;

    // Account for the desktop leaderboard transform.
    // The measured top section uses layout height, but the rendered
    // leaderboard is scaled down by DESKTOP_LEADERBOARD_SCALE.
    const renderedTopInfoHeight =
      this.desktopTopInfoHeight * LayoutScaleService.DESKTOP_LEADERBOARD_SCALE;

    const heightScale = availableHeight / renderedTopInfoHeight;

    // Use whichever scale is smaller so both width and height fit
    let scale = Math.min(widthScale, heightScale);

    // Temporary mobile tuning
    const mobileMultiplier =
      this.driverCount <= 20
        ? LayoutScaleService.MOBILE_SCALE_MULTIPLIER
        : 1.0437;

    scale *= mobileMultiplier;

    // Prevent it becoming ridiculously small
    scale = Math.max(LayoutScaleService.MOBILE_MIN_SCALE, Math.min(scale, 1));

    const leaderboardPercent = 0.48;

    const leaderboardWidth =
      leftPanelWidth * LayoutScaleService.MOBILE_LEADERBOARD_PERCENT;

    const sidebarWidth = leftPanelWidth - leaderboardWidth;

    this.metricsSubject.next({
      scale,
      leftPanelWidth,
      leaderboardWidth,
      sidebarWidth,
    });
  }
}
