import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-dual-recommendation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dual-recommendation-card.component.html',
  styleUrl: './dual-recommendation-card.component.scss',
})
export class DualRecommendationCardComponent {
  compatibilityScore = 99;

  driverA = {
    driverCode: 'HAM',
    teamColor: '#27F4D2',

    availableLaps: [17],
    selectedLap: 17,

    lapNumber: 17,
    lapTimeSeconds: 71.614,

    compound: 'MEDIUM',
    tyreAge: 17,
    position: 5,

    representative: {
      score: 98,
      lapTime: 100,
      sector: 100,
      position: 100,
      traffic: 90,
    },

    traffic: {
      cleanAir: 33.3,
      dirtyAir: 66.7,
      wake: 14.2,
      maxWake: 59.4,
      avgGap: 115.5,
      closestGap: 35.9,
    },

    drs: {
      nearest: 'SAI',
      usage: 0,
      following: 0,
    },
  };

  driverB = {
    driverCode: 'VER',
    teamColor: '#3671C6',

    availableLaps: [17, 18, 19],
    selectedLap: 17,

    lapNumber: 17,
    lapTimeSeconds: 70.921,

    compound: 'MEDIUM',
    tyreAge: 17,
    position: 1,

    representative: {
      score: 100,
      lapTime: 100,
      sector: 99,
      position: 100,
      traffic: 100,
    },

    traffic: {
      cleanAir: 100,
      dirtyAir: 0,
      wake: 0,
      maxWake: 0,
      avgGap: null,
      closestGap: null,
    },

    drs: {
      nearest: null,
      usage: 0,
      following: 0,
    },
  };

  reasons = [
    'Both laps were completed on Medium tyres.',
    'Race pace closely matched over the stint.',
    'Both drivers maintained stable positions.',
    'Sector consistency was excellent.',
  ];

  formatLapTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);

    const secs = (seconds % 60).toFixed(3).padStart(6, '0');

    return `${minutes}:${secs}`;
  }

  lapDifference(current: number, other: number): string | null {
    if (current <= other) {
      return null;
    }

    return `+${(current - other).toFixed(3)}`;
  }
}
