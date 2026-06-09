export interface WeatherEntry {
  raceSecond: number;

  AirTemp: number;
  Humidity: number;
  Pressure: number;

  Rainfall: boolean;

  TrackTemp: number;

  WindDirection: number;
  WindSpeed: number;
}

export interface WeatherResponse {
  session: {
    year: number;
    Date: string;
    event: string;
    location: string;
    type: string;
  };

  weatherData: WeatherEntry[];
}
