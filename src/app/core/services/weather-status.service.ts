import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { RaceClockService } from './race-clock-service';
import { WeatherEntry, WeatherResponse } from '../models/weather.model';

@Injectable({
  providedIn: 'root',
})
export class WeatherStatusService {
  private weatherData: WeatherEntry[] = [];

  private currentWeatherSubject = new BehaviorSubject<WeatherEntry | null>(
    null,
  );

  currentWeather$ = this.currentWeatherSubject.asObservable();

  constructor(
    private http: HttpClient,
    private raceClock: RaceClockService,
  ) {
    this.raceClock.raceTime$.subscribe((raceSecond) => {
      this.updateCurrentWeather(raceSecond);
    });
  }

  load(year: number, round: number): void {
    this.http
      .get<WeatherResponse>(`/api/weather/${year}/${round}`)
      .subscribe((res) => {
        this.weatherData = res.weatherData;
      });
  }

  private updateCurrentWeather(raceSecond: number): void {
    if (!this.weatherData.length) {
      this.currentWeatherSubject.next(null);
      return;
    }

    const weather = this.findWeatherForRaceSecond(raceSecond);

    this.currentWeatherSubject.next(weather);
  }

  private findWeatherForRaceSecond(raceSecond: number): WeatherEntry | null {
    let latest: WeatherEntry | null = null;
    for (const entry of this.weatherData) {
      if (entry.raceSecond <= raceSecond) {
        latest = entry;
      } else {
        break;
      }
    }
    return latest;
  }
}
