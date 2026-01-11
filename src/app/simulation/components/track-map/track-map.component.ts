import { Component, OnInit } from '@angular/core';
import { TRACK_DATA, TrackPoint } from './track-data';

@Component({
  selector: 'app-track-map',
  standalone: true,
  imports: [],
  templateUrl: './track-map.component.html',
  styleUrl: './track-map.component.scss',
})
export class TrackMapComponent implements OnInit {
  track: TrackPoint[] = TRACK_DATA.coordinates;
  trackInfo = TRACK_DATA.trackInfo;

  trackPoints = '';
  viewBox = '';

  startLine = { x1: 0, y1: 0, x2: 0, y2: 0 };

  arrow = {
    cx: 0,
    cy: 0,
    angle: 0,
  };

  ngOnInit(): void {
    // 1️⃣ build track polyline
    this.trackPoints = this.track.map((p) => `${p.x},${p.y}`).join(' ');

    // 2️⃣ compute viewBox
    const xs = this.track.map((p) => p.x);
    const ys = this.track.map((p) => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    this.viewBox = [minX, minY, maxX - minX, maxY - minY].join(' ');

    // 3️⃣ compute start line
    const startIndex = this.track.findIndex((p) => p.isStart);
    if (startIndex === -1 || startIndex === this.track.length - 1) return;

    const p1 = this.track[startIndex];
    const p2 = this.track[startIndex + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    const nx = -dy / len;
    const ny = dx / len;

    // Start line length
    const halfWidth = 180;

    this.startLine = {
      x1: p1.x + nx * halfWidth,
      y1: p1.y + ny * halfWidth,
      x2: p1.x - nx * halfWidth,
      y2: p1.y - ny * halfWidth,
    };

    // arrow direction (same as track)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // offset arrow to the side of track
    const sideOffset = 740; // distance from track center
    const forwardOffset = -120; // move slightly ahead of start line

    this.arrow = {
      cx: p1.x + (dx / len) * forwardOffset + nx * sideOffset,
      cy: p1.y + (dy / len) * forwardOffset + ny * sideOffset,
      angle,
    };
  }

  isMirrored = false;

  toggleMirror() {
    this.isMirrored = !this.isMirrored;
  }
}
