import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-recommendation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recommendation-card.component.html',
  styleUrl: './recommendation-card.component.scss',
})
export class RecommendationCardComponent {
  driverCode = 'HAM';
  teamColor = '#00d2be';

  lap = {
    lapNumber: 17,
    lapTimeSeconds: '1:11.614',
    compound: 'MEDIUM',
    tyreAge: 17,
    position: 5,

    representative: {
      score: 98,

      lapTime: {
        score: 100,
      },

      sector: {
        score: 100,

        sector1Delta: 0.0,

        sector2Delta: -0.019,

        sector3Delta: 0.0,
      },

      position: {
        score: 100,

        deltaPosition: 0,
      },

      traffic: {
        score: 90,
      },
    },

    traffic: {
      score: 90,

      cleanAirPercentage: 33.3,

      timeInDirtyAir: 66.7,

      weightedDirtyAir: 14.3,

      averageWakePercentage: 14.2,

      maximumWakePercentage: 59.4,

      averageFollowingGapDistance: 115.5,

      closestFollowingGapDistance: 35.9,
    },

    drs: {
      nearestCarAhead: 'SAI',

      drsUsagePercentage: 0,

      drsWhileFollowingPercentage: 0,
    },

    reasons: [
      'Lap time matched the stint median',
      'All three sectors were consistent',
      'Position remained stable',
      'MEDIUM tyres with 17 laps of wear',
      'Moderate traffic with noticeable wake (14%)',
    ],
  };
}
