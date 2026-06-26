import { Component, Input } from '@angular/core';
import { TrackMap } from '../../../core/models/qualifying-comparison.model';

@Component({
  selector: 'app-comparison-track-map',
  standalone: true,
  templateUrl: './comparison-track-map.component.html',
  styleUrl: './comparison-track-map.component.scss',
})
export class ComparisonTrackMapComponent {
  @Input({ required: true })
  trackMap!: TrackMap;

  get viewBox(): string {
    const b = this.trackMap.bounds;

    const width = b.maxX - b.minX;

    const height = b.maxY - b.minY;

    const paddingX = width * 0.1;
    const paddingY = height * 0.1;

    return `
    ${b.minX - paddingX}
    ${b.minY - paddingY}
    ${width + paddingX * 2}
    ${height + paddingY * 2}
  `;
  }

  get polylinePoints(): string {
    return this.trackMap.points.map((p) => `${p.x},${p.y}`).join(' ');
  }

  get startFinishMarkerX(): number {
    return (this.trackMap.startFinish.x1 + this.trackMap.startFinish.x2) / 2;
  }

  get startFinishMarkerY(): number {
    return (this.trackMap.startFinish.y1 + this.trackMap.startFinish.y2) / 2;
  }

  get startFinishLine() {
    const sf = this.trackMap.startFinish;

    const dx = sf.x2 - sf.x1;
    const dy = sf.y2 - sf.y1;

    const length = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / length;
    const uy = dy / length;

    const extension = 350;

    return {
      x1: sf.x1 - ux * extension,
      y1: sf.y1 - uy * extension,

      x2: sf.x2 + ux * extension,
      y2: sf.y2 + uy * extension,
    };
  }
}
