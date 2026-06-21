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

export interface Feature {
  title: string;
  description: string;
  extraNote?: string;

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
  ) {}

  features: Feature[] = [
    {
      title: 'Qualifying Results',
      description:
        'View qualifying lap times and starting grid before the race',
      type: 'image',
      mediaUrl: 'assets/features/qualifying-results.png',
    },
    {
      title: 'Live Leaderboard',
      description:
        'Track every position change, interval and battle as the race unfolds',
      extraNote:
        '* Position gaps and intervals are calculated using FIA TIMING-LOOP principles',
      type: 'video',
      mediaUrl: 'assets/features/live-leaderboard.mp4',
    },
    {
      title: 'Controls Area',
      description:
        'Check PitStop count, Tyre Age & Lapped Cars anytime on the go',
      type: 'video',
      mediaUrl: 'assets/features/controls-area.mp4',
    },
    {
      title: 'Interactive Track Map',
      description:
        'Watch every driver navigate the circuit with real-time car positioning',
      type: 'video',
      mediaUrl: 'assets/features/track-map.mp4',
    },
    {
      title: 'Race Control Messages',
      description:
        'Follow official FIA race control events including flags, penalties and investigations',
      type: 'video',
      mediaUrl: 'assets/features/race-control-messages.mp4',
    },
    {
      title: 'Weather Conditions',
      description:
        'Monitor track temperature, air temperature, humidity, wind and rainfall',
      type: 'video',
      mediaUrl: 'assets/features/weather.mp4',
    },
    {
      title: 'Race Clock',
      description:
        'Control playback speed and relive the race at your own pace',
      extraNote:
        '* At 4x speed, a 90-minute race completes in approximately 22 minutes',
      type: 'video',
      mediaUrl: 'assets/features/race-clock.mp4',
    },
    {
      title: 'Driver Telemetry',
      description: 'Dive deeper into speed, throttle, brake, RPM and gear data',
      type: 'video',
      mediaUrl: 'assets/features/driver-telemetry.mp4',
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
    this.router.navigate(['/select-race']);
  }
}
