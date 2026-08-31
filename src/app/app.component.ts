import { Component, effect, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingOverlayComponent } from './simulation/components/loading-overlay/loading-overlay.component';
import { BrowserService } from './core/services/browser.service';
import { PwaService } from './core/services/pwa.service';
import { InstallPitwallDialogComponent } from './shared/components/install-pitwall-dialog/install-pitwall-dialog.component';
import { SplashScreenComponent } from './pages/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingOverlayComponent, SplashScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'pitwallf1';

  showInstallDialog = signal(true);

  showSplash = true;

  constructor(
    public browserService: BrowserService,
    public pwaService: PwaService,
  ) {
    // effect(() => {
    //   console.log('Installed:', this.pwaService.isInstalled());
    //   console.log('Can Install:', this.pwaService.canInstall());
    // });
  }

  hideSplash(): void {
    this.showSplash = false;
  }
}
