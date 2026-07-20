import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  AfterViewInit,
  ElementRef,
  QueryList,
  ViewChildren,
  NgZone,
} from '@angular/core';
import { SupportButtonComponent } from '../../shared/components/support-button/support-button.component';
import { RaceContextService } from '../../core/services/race-context.service';

export interface Feature {
  title: string;
  description: string;
  extraNote?: string;
  extraNote2?: string;

  type: 'video' | 'image';

  mediaUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SupportButtonComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  constructor(
    private ngZone: NgZone,
    private router: Router,
    private raceContext: RaceContextService,
  ) {}

  features: Feature[] = [
    // {
    //   title: 'Qualifying Results',
    //   description:
    //     'View qualifying lap times and starting grid before the race',
    //   type: 'image',
    //   mediaUrl: 'assets/features/qualifying-results.png',
    // },
    {
      title: 'Live Leaderboard',
      description:
        'Track every position change, interval and battle as the race unfolds',
      extraNote:
        '* Position gaps and intervals are calculated using FIA TIMING-LOOP principles',
      type: 'video',
      mediaUrl: 'assets/features/live-leaderboard.mp4',
    },
    // {
    //   title: 'Controls Area',
    //   description:
    //     'Check PitStop count, Tyre Age & Lapped Cars anytime on the go',
    //   type: 'video',
    //   mediaUrl: 'assets/features/controls-area.mp4',
    // },
    {
      title: 'Interactive Track Map',
      description:
        'Watch every driver navigate the circuit with real-time car positioning',
      type: 'video',
      mediaUrl: 'assets/features/track-map.mp4',
    },
    // {
    //   title: 'Race Control Messages',
    //   description:
    //     'Follow official FIA race control events including flags, penalties and investigations',
    //   type: 'video',
    //   mediaUrl: 'assets/features/race-control-messages.mp4',
    // },
    // {
    //   title: 'Weather Conditions',
    //   description:
    //     'Monitor track temperature, air temperature, humidity, wind and rainfall',
    //   type: 'video',
    //   mediaUrl: 'assets/features/weather.mp4',
    // },
    // {
    //   title: 'Race Clock',
    //   description:
    //     'Control playback speed and relive the race at your own pace',
    //   extraNote:
    //     '* At 4x speed, a 90-minute race completes in approximately 22 minutes',
    //   type: 'video',
    //   mediaUrl: 'assets/features/race-clock.mp4',
    // },
    {
      title: 'Driver Telemetry',
      description: 'Dive deeper into speed, throttle, brake, RPM and gear data',
      type: 'video',
      mediaUrl: 'assets/features/driver-telemetry.mp4',
    },
    {
      title: 'Red Flag Seek',
      description:
        'Jump directly to the race restart point when a red flag interrupts the session',
      type: 'image',
      mediaUrl: 'assets/features/redflag-seek.png',
    },
    {
      title: 'FIA Official Classification',
      description:
        'View the official FIA race classification, Fastest lap, and Championship standings at the chequered flag',
      type: 'image',
      mediaUrl: 'assets/features/final-classification.png',
    },

    {
      title: 'Performance Lab',
      description: 'Ultimate Pace & Race Managament',
      extraNote: '* Ultimate Pace - Qualifying lap analysis.',
      extraNote2: '* Race Management - AI-powered representative race laps.',
      type: 'video',
      mediaUrl: 'assets/features/performance-lab.mp4',
    },
    {
      title: 'Compare Driving Styles',
      description:
        'Analyze race or qualifying laps side by side with synchronized telemetry graphs and track position playback.',
      extraNote:
        '* Hover over the telemetry graphs to view the per frame telemtry info.',
      type: 'video',
      mediaUrl: 'assets/features/comparison-telemetry.mp4',
    },
  ];

  @ViewChildren('featureSection')
  featureSections!: QueryList<ElementRef>;

  visibleSections = new Set<number>();

  ngAfterViewInit(): void {
    window.addEventListener(
      'wheel',
      () => {
        document.querySelectorAll('video').forEach((video) => {
          const v = video as HTMLVideoElement;

          v.muted = true;
          v.play()
            .then(() => v.pause())
            .catch(() => {});
        });
      },
      { once: true },
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));

          const video = entry.target.querySelector(
            'video',
          ) as HTMLVideoElement | null;

          if (entry.isIntersecting) {
            this.visibleSections.add(index);

            if (video) {
              // video.currentTime = 0;

              video.play().catch(() => {});
            }
          } else {
            if (video) {
              video.pause();
            }
          }
        });
      },
      {
        threshold: 0.7,
      },
    );

    this.featureSections.forEach((section) => {
      observer.observe(section.nativeElement);
    });
  }

  goToRaceSelection(): void {
    this.raceContext.reset();

    this.raceContext.navigationStep = 'race-selection';

    this.router.navigate(['/select-race']);
  }
}
