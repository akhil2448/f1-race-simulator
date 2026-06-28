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
