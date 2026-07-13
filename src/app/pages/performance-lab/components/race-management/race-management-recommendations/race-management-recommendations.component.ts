import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-race-management-recommendations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-management-recommendations.component.html',
  styleUrl: './race-management-recommendations.component.scss',
})
export class RaceManagementRecommendationsComponent {
  recommendations = [
    {
      driverCode: 'VER',
      lap: 31,
      tyre: 'HARD',
      confidence: 98,
      reasons: [
        'Tyre age closely matched',
        'Clean air',
        'No DRS',
        'Similar fuel load',
      ],
    },
    {
      driverCode: 'NOR',
      lap: 33,
      tyre: 'HARD',
      confidence: 96,
      reasons: [
        'Matching tyre degradation',
        'Minimal traffic',
        'Comparable race pace',
      ],
    },
  ];
}
