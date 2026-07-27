import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Observable } from 'rxjs';

import { WeatherStatusService } from '../../../core/services/weather-status.service';
import { WeatherEntry } from '../../../core/models/weather.model';
import { LayoutScaleService } from '../../../core/services/layout-scale.service';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.scss',
})
export class WeatherComponent {
  weather$: Observable<WeatherEntry | null>;

  mobileScale = 1;

  constructor(
    private weatherStatus: WeatherStatusService,
    private layoutScale: LayoutScaleService,
  ) {
    this.weather$ = this.weatherStatus.currentWeather$;

    this.layoutScale.metrics$.subscribe((layout) => {
      this.mobileScale = layout.scale;
    });
  }

  getWindDirection(deg: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    const index = Math.round(deg / 45) % 8;

    return directions[index];
  }

  @HostBinding('style.--panel-scale')
  get panelScaleCss(): number {
    return this.mobileScale;
  }
}
