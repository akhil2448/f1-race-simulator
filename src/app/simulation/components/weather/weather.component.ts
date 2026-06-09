import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Observable } from 'rxjs';

import { WeatherStatusService } from '../../../core/services/weather-status.service';
import { WeatherEntry } from '../../../core/models/weather.model';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.scss',
})
export class WeatherComponent {
  weather$: Observable<WeatherEntry | null>;

  constructor(private weatherStatus: WeatherStatusService) {
    this.weather$ = this.weatherStatus.currentWeather$;
  }

  getWindDirection(deg: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    const index = Math.round(deg / 45) % 8;

    return directions[index];
  }
}
