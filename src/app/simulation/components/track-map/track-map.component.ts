import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelemetryCar } from '../../../core/models/race-telemetry.model';
import { SimulationEngineService } from '../../../core/services/simulation-engine.service';
import { TrackMapService } from '../../../core/services/track-map.service';
import { TrackInfo, TrackPoint } from '../../../core/models/track-data.model';
import { DriverMetaService } from '../../../core/services/driver-meta.service';

@Component({
  selector: 'app-track-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-map.component.html',
  styleUrl: './track-map.component.scss',
})
export class TrackMapComponent implements OnInit {
  constructor(
    private engine: SimulationEngineService,
    private trackMap: TrackMapService,
    private driverMeta: DriverMetaService
  ) {}

  /* ---------- UI ---------- */
  isMirrored = false;

  /* ---------- TRACK DATA ---------- */
  track!: TrackPoint[];
  trackInfo!: TrackInfo;

  trackPoints = '';
  viewBox = '';

  startLine = { x1: 0, y1: 0, x2: 0, y2: 0 };
  arrow = { cx: 0, cy: 0, angle: 0 };

  /* ---------- CARS ---------- */
  cars: TelemetryCar[] = [];

  /* ---------- DISTANCE MAPPING ---------- */
  trackDistances: number[] = [];
  totalTrackLength = 0;
  trackReady = false;

  realTrackLengthMeters = 0;

  ngOnInit(): void {
    /* ---------- TRACK DATA (ASYNC SAFE) ---------- */
    this.trackMap.track$.subscribe((data) => {
      if (!data) return;

      this.track = data.coordinates;
      this.trackInfo = data.trackInfo;
      this.realTrackLengthMeters = data.trackInfo.trackLength;

      this.buildTrack();
    });

    /* ---------- TELEMETRY ---------- */
    this.engine.frame$.subscribe((frame) => {
      if (!frame || !frame.cars.length) return;
      this.cars = frame.cars;
    });
  }

  /* ===================================================== */
  /* TRACK BUILDING                                        */
  /* ===================================================== */

  private buildTrack(): void {
    /* ---------- SVG POLYLINE ---------- */
    this.trackPoints = this.track.map((p) => `${p.x},${p.y}`).join(' ');

    const xs = this.track.map((p) => p.x);
    const ys = this.track.map((p) => p.y);
    const padding = 380;

    this.viewBox = [
      Math.min(...xs) - padding,
      Math.min(...ys) - padding,
      Math.max(...xs) - Math.min(...xs) + padding * 2,
      Math.max(...ys) - Math.min(...ys) + padding * 2,
    ].join(' ');

    /* ---------- START / FINISH ---------- */
    const startIndex = this.track.findIndex((p) => p.isStart);
    const finishIndex = this.track.findIndex((p) => p.isFinish);

    if (startIndex === -1 || finishIndex === -1) {
      throw new Error('Track must define isStart and isFinish');
    }

    /* ---------- START LINE + ARROW ---------- */
    if (startIndex < this.track.length - 1) {
      const p1 = this.track[startIndex];
      const p2 = this.track[startIndex + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);

      const nx = -dy / len;
      const ny = dx / len;

      const halfWidth = 300;

      this.startLine = {
        x1: p1.x + nx * halfWidth,
        y1: p1.y + ny * halfWidth,
        x2: p1.x - nx * halfWidth,
        y2: p1.y - ny * halfWidth,
      };

      this.arrow = {
        cx: p1.x + nx * 740 - (dx / len) * 120,
        cy: p1.y + ny * 740 - (dy / len) * 120,
        angle: Math.atan2(dy, dx) * (180 / Math.PI),
      };
    }

    /* ---------- DISTANCE TABLE ---------- */
    this.trackDistances = [0];
    this.totalTrackLength = 0;

    for (let i = startIndex + 1; i <= finishIndex; i++) {
      const prev = this.track[i - 1];
      const curr = this.track[i];
      const d = Math.hypot(curr.x - prev.x, curr.y - prev.y);

      this.totalTrackLength += d;
      this.trackDistances.push(this.totalTrackLength);
    }

    /* ---------- CLOSE LOOP ---------- */
    const start = this.track[startIndex];
    const finish = this.track[finishIndex];

    this.totalTrackLength += Math.hypot(start.x - finish.x, start.y - finish.y);

    this.trackReady = true;

    console.log('SVG track length:', this.totalTrackLength);
    console.log('Real track length:', this.realTrackLengthMeters);
  }

  /* ===================================================== */
  /* POSITIONING                                           */
  /* ===================================================== */

  toSvgDistance(distanceMeters: number): number {
    return (
      ((distanceMeters % this.realTrackLengthMeters) /
        this.realTrackLengthMeters) *
      this.totalTrackLength
    );
  }

  getCarPosition(distance: number) {
    if (!this.trackReady) return this.track[0];

    const target =
      ((distance % this.totalTrackLength) + this.totalTrackLength) %
      this.totalTrackLength;

    for (let i = 1; i < this.trackDistances.length; i++) {
      if (this.trackDistances[i] >= target) {
        const prev = this.trackDistances[i - 1];
        const ratio = (target - prev) / (this.trackDistances[i] - prev);

        const p1 = this.track[i - 1];
        const p2 = this.track[i];

        return {
          x: p1.x + (p2.x - p1.x) * ratio,
          y: p1.y + (p2.y - p1.y) * ratio,
        };
      }
    }

    return this.track[0];
  }

  toggleMirror() {
    this.isMirrored = !this.isMirrored;
  }

  get eventYear(): string {
    const match = this.trackInfo?.officialEventName.match(/\d{4}$/);
    return match ? match[0] : '';
  }

  getCarColor(driver: string): string {
    return this.driverMeta.get(driver)?.color ?? '#ffffff';
  }
}
