import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { TrackMap } from '../../models/qualifying-comparison.model';
import { LapPlaybackService } from '../../services/lap-playback.service';
import { DriverTheme } from '../../models/comparison-theme.model';
import { TelemetryHoverService } from '../../services/telemetry-hover.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-comparison-track-map',
  standalone: true,
  templateUrl: './comparison-track-map.component.html',
  styleUrl: './comparison-track-map.component.scss',
})
export class ComparisonTrackMapComponent implements OnChanges, OnInit {
  @Input({ required: true })
  trackMap!: TrackMap;

  @Input({ required: true })
  driverATelemetry!: any[];

  @Input()
  driverBTelemetry: any[] | null = null;

  @Input({ required: true })
  driverATheme!: DriverTheme;

  @Input()
  driverBTheme: DriverTheme | null = null;

  @Input({ required: true })
  progress = 0;

  private readonly STACK_DISTANCE = 120;

  private playbackService = inject(LapPlaybackService);
  private hoverService = inject(TelemetryHoverService);
  private destroyRef = inject(DestroyRef);

  private cachedDominanceMap:
    | {
        x: number;
        y: number;
        delta: number;
        gain: number;
        winner: 'A' | 'B' | 'N';
      }[]
    | null = null;

  hoverPosition: { x: number; y: number } | null = null;

  ngOnInit(): void {
    this.hoverService.hoverProgress$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((progress) => {
        if (progress == null || !this.driverATelemetry?.length) {
          this.hoverPosition = null;
          return;
        }

        const frame = this.playbackService.interpolateTelemetry(
          this.driverATelemetry,
          progress,
        );

        this.hoverPosition = frame
          ? {
              x: frame.sample.x,
              y: frame.sample.y,
            }
          : null;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driverATelemetry'] || changes['driverBTelemetry']) {
      this.cachedDominanceMap = null;
    }
  }

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

  private buildDominanceMap(): {
    x: number;
    y: number;
    delta: number;
    gain: number;
    winner: 'A' | 'B' | 'N';
  }[] {
    if (!this.driverBTelemetry?.length) {
      return [];
    }

    const telemetryA = this.driverATelemetry;
    const telemetryB = this.driverBTelemetry;

    const result: {
      x: number;
      y: number;
      delta: number;
      gain: number;
      winner: 'A' | 'B' | 'N';
    }[] = [];

    let bIndex = 0;

    //
    // Build exactly like your delta graph
    //
    for (const pointA of telemetryA) {
      while (
        bIndex < telemetryB.length - 2 &&
        telemetryB[bIndex + 1].d < pointA.d
      ) {
        bIndex++;
      }

      const before = telemetryB[bIndex];
      const after = telemetryB[bIndex + 1];

      if (!before || !after) {
        continue;
      }

      const span = after.d - before.d;

      let interpolatedTime = before.t;

      if (span > 0) {
        const ratio = (pointA.d - before.d) / span;

        interpolatedTime = before.t + ratio * (after.t - before.t);
      }

      result.push({
        x: pointA.x,
        y: pointA.y,
        delta: interpolatedTime - pointA.t,
        gain: 0,
        winner: 'N',
      });
    }

    //
    // Compute gain from neighbouring delta points
    //
    const LOOKAHEAD_METERS = 20;

    const EPSILON = 0.0015;

    for (let i = 0; i < result.length; i++) {
      let lookAheadIndex = i;

      while (
        lookAheadIndex < result.length - 1 &&
        this.driverATelemetry[lookAheadIndex].d <
          this.driverATelemetry[i].d + LOOKAHEAD_METERS
      ) {
        lookAheadIndex++;
      }

      const gain = result[lookAheadIndex].delta - result[i].delta;

      result[i].gain = gain;

      result[i].winner = gain > EPSILON ? 'A' : gain < -EPSILON ? 'B' : 'N';
    }

    let previous: 'A' | 'B' = 'A';

    for (const point of result) {
      if (point.winner === 'N') {
        point.winner = previous;
      } else {
        previous = point.winner;
      }
    }

    return result;
  }

  private get dominanceMap() {
    if (!this.cachedDominanceMap) {
      this.cachedDominanceMap = this.buildDominanceMap();
    }

    return this.cachedDominanceMap;
  }

  get driverADominancePath(): string {
    const commands: string[] = [];

    let drawing = false;

    for (const p of this.dominanceMap) {
      if (p.winner === 'A') {
        commands.push(`${drawing ? 'L' : 'M'} ${p.x} ${p.y}`);

        drawing = true;
      } else {
        if (drawing) {
          commands.push(`L ${p.x} ${p.y}`);
        }

        drawing = false;
      }
    }

    return commands.join(' ');
  }

  get driverBDominancePath(): string {
    const commands: string[] = [];

    let drawing = false;

    for (const p of this.dominanceMap) {
      if (p.winner === 'B') {
        commands.push(`${drawing ? 'L' : 'M'} ${p.x} ${p.y}`);

        drawing = true;
      } else {
        if (drawing) {
          commands.push(`L ${p.x} ${p.y}`);
        }

        drawing = false;
      }
    }

    return commands.join(' ');
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

    const playbackFrame = this.playbackService.currentFrame;

    const frameA = playbackFrame?.driverA ?? null;

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

    const frameB = playbackFrame?.driverB ?? null;

    if (frameB) {
      driverB = {
        x: frameB.sample.x,
        y: frameB.sample.y,
      };
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
