import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
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

  load(year: number, round: number): Observable<WeatherResponse> {
    return this.http.get<WeatherResponse>(`/api/weather/${year}/${round}`);
  }

  setWeatherData(weatherData: WeatherEntry[]): void {
    this.weatherData = weatherData;
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

  clear(): void {
    this.weatherData = [];

    this.currentWeatherSubject.next(null);
  }
}
