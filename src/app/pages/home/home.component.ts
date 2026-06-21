import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  AfterViewInit,
  ElementRef,
  QueryList,
  ViewChildren,
} from '@angular/core';

interface Feature {
  title: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  features: Feature[] = [
    {
      title: 'Live Leaderboard',
      description:
        'Track every position change, interval and battle as the race unfolds.',
    },
    {
      title: 'Interactive Track Map',
      description:
        'Watch every driver navigate the circuit with real-time car positioning.',
    },
    {
      title: 'Race Control Messages',
      description:
        'Follow official FIA race control events including flags, penalties and investigations.',
    },
    {
      title: 'Weather Conditions',
      description:
        'Monitor track temperature, air temperature, humidity, wind and rainfall.',
    },
    {
      title: 'Race Clock',
      description:
        'Control playback speed and relive the race at your own pace.',
    },
    {
      title: 'Driver Telemetry',
      description:
        'Dive deeper into speed, throttle, brake, RPM and gear data.',
    },
  ];

  @ViewChildren('featureSection')
  featureSections!: QueryList<ElementRef>;

  visibleSections = new Set<number>();

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));

          if (entry.isIntersecting) {
            this.visibleSections.add(index);
          }
        });
      },
      {
        threshold: 0.4,
      },
    );

    this.featureSections.forEach((section) => {
      observer.observe(section.nativeElement);
    });
  }
}
