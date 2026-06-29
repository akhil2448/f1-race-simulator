import { Component, Input, inject } from '@angular/core';
import { TrackMap } from '../../../core/models/qualifying-comparison.model';
import { LapPlaybackService } from '../../services/lap-playback.service';

@Component({
  selector: 'app-comparison-track-map',
  standalone: true,
  templateUrl: './comparison-track-map.component.html',
  styleUrl: './comparison-track-map.component.scss',
})
export class ComparisonTrackMapComponent {
  @Input({ required: true })
  trackMap!: TrackMap;

  @Input({ required: true })
  driverATelemetry!: any[];

  @Input()
  driverBTelemetry: any[] | null = null;

  @Input({ required: true })
  progress = 0;

  private readonly STACK_DISTANCE = 120;

  private playbackService = inject(LapPlaybackService);

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

  get sector1Polyline(): string {
    return this.trackMap.sector1.map((p) => `${p.x},${p.y}`).join(' ');
  }

  get sector2Polyline(): string {
    return this.trackMap.sector2.map((p) => `${p.x},${p.y}`).join(' ');
  }

  get sector3Polyline(): string {
    return this.trackMap.sector3.map((p) => `${p.x},${p.y}`).join(' ');
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

  get cornerLabels() {
    const OFFSET = 470;

    return this.trackMap.corners.map((corner) => {
      //
      // Find the closest point on the track.
      //

      let closestIndex = 0;
      let closestDistance = Number.MAX_VALUE;

      this.trackMap.sector1
        .concat(this.trackMap.sector2)
        .concat(this.trackMap.sector3)
        .forEach((p, index) => {
          const dx = p.x - corner.x;
          const dy = p.y - corner.y;

          const distance = dx * dx + dy * dy;

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

      const track = this.trackMap.sector1
        .concat(this.trackMap.sector2)
        .concat(this.trackMap.sector3);

      const previous = track[Math.max(0, closestIndex - 1)];
      const next = track[Math.min(track.length - 1, closestIndex + 1)];

      //
      // Tangent of the track.
      //

      const tx = next.x - previous.x;
      const ty = next.y - previous.y;

      const length = Math.sqrt(tx * tx + ty * ty);

      const ux = tx / length;
      const uy = ty / length;

      //
      // Normal vector.
      //

      let nx = -uy;
      let ny = ux;

      //
      // Make the normal point away from the centre.
      //

      const centerX =
        (this.trackMap.bounds.minX + this.trackMap.bounds.maxX) / 2;

      const centerY =
        (this.trackMap.bounds.minY + this.trackMap.bounds.maxY) / 2;

      const vx = corner.x - centerX;
      const vy = corner.y - centerY;

      if (vx * nx + vy * ny < 0) {
        nx *= -1;
        ny *= -1;
      }

      return {
        number: corner.number,

        x: corner.x + nx * OFFSET,

        y: corner.y + ny * OFFSET,
      };
    });
  }

  get displayPositions(): {
    driverA: { x: number; y: number } | null;
    driverB: { x: number; y: number } | null;
  } {
    //
    // Driver A
    //

    const frameA = this.playbackService.interpolateTelemetry(
      this.driverATelemetry,
      this.progress,
    );

    const driverA = frameA
      ? {
          x: frameA.sample.x,
          y: frameA.sample.y,
        }
      : null;

    //
    // Driver B
    //

    let driverB: { x: number; y: number } | null = null;

    if (this.driverBTelemetry?.length) {
      const frameB = this.playbackService.interpolateTelemetry(
        this.driverBTelemetry,
        this.progress,
      );

      if (frameB) {
        driverB = {
          x: frameB.sample.x,
          y: frameB.sample.y,
        };
      }
    }

    //
    // No Driver A or Driver B
    //

    if (!driverA || !driverB) {
      return {
        driverA,
        driverB,
      };
    }

    //
    // Distance between cars
    //

    const dx = driverA.x - driverB.x;
    const dy = driverA.y - driverB.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    //
    // Far enough apart
    //

    if (distance > this.STACK_DISTANCE) {
      return {
        driverA,
        driverB,
      };
    }

    //
    // Stack horizontally
    //

    const centerX = (driverA.x + driverB.x) / 2;
    const centerY = (driverA.y + driverB.y) / 2;

    const offset = 90;

    return {
      driverA: {
        x: centerX - offset,
        y: centerY,
      },

      driverB: {
        x: centerX + offset,
        y: centerY,
      },
    };
  }
}
