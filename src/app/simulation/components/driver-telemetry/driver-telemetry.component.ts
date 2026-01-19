import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RaceClockService } from '../../../core/services/race-clock-service';
import {
  DriverTelemetryBufferService,
  DriverTelemetryPoint,
} from '../../../core/services/driver-telemetry-buffer.service';
import { Subject, interval, combineLatest, EMPTY } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';

export interface DriverTelemetryView {
  speed: number;
  gear: number;
  rpm: number;
  throttle: number;
  brake: boolean;
  lap: number;
}

@Component({
  selector: 'app-driver-telemetry',
  standalone: true,
  imports: [CommonModule],
  providers: [DriverTelemetryBufferService], // ✅ unique instance per panel
  templateUrl: './driver-telemetry.component.html',
  styleUrl: './driver-telemetry.component.scss',
})
export class DriverTelemetryComponent implements OnChanges, OnDestroy {
  @Input() selectedDriver: string | null = null;
  @Input() availableDrivers: string[] = [];
  @Input() teamColor: string | null = null;

  @Output() driverSelected = new EventEmitter<string>();
  @Output() clearDriver = new EventEmitter<void>();

  telemetry: DriverTelemetryView | null = null;

  confirmChange = false;

  private destroy$ = new Subject<void>();

  constructor(
    private raceClock: RaceClockService,
    private buffer: DriverTelemetryBufferService,
  ) {
    /**
     * 🚀 10 Hz telemetry sampling interval(100)
     * - We'll downsample for better readability
     * - raceClock gives us the "base second"
     * - Also pause the telemetryClock when raceClock is paused
     * - To handle looping of the same telemetry data when raceClock is paused
     */
    let lastUiTick = performance.now();
    let lastRaceSecond = 0;

    combineLatest([this.raceClock.raceTime$, this.raceClock.isPaused$])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([raceSecond, isPaused]) => {
          lastRaceSecond = raceSecond;

          if (isPaused) {
            return EMPTY; // ⛔ freeze UI completely
          }

          // ✅ UI refresh rate (independent of race speed)
          return interval(200); // 5 Hz (readable)
        }),
      )
      .subscribe(() => {
        if (!this.selectedDriver) return;

        const now = performance.now();
        const elapsedMs = now - lastUiTick;
        lastUiTick = now;

        // 🧠 Speed-aware fractional race time
        const fractionalRaceTime =
          lastRaceSecond + (elapsedMs / 1000) * this.getRaceSpeed();

        const p = this.buffer.getSampleAt(fractionalRaceTime);
        if (!p) return;

        this.telemetry = this.mapTelemetry(p, fractionalRaceTime);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDriver']) {
      this.confirmChange = false; // 🔑 reset confirmation

      if (!this.selectedDriver) {
        this.buffer.clear();
        this.telemetry = null;
        return;
      }

      const now = this.raceClock.getCurrentSecond();

      // 🔁 Fetch telemetry window starting from *current* race time
      this.buffer.initialize(2021, 7, this.selectedDriver, now).subscribe();
    }
  }

  private mapTelemetry(
    p: DriverTelemetryPoint,
    sec: number,
  ): DriverTelemetryView {
    return {
      speed: Math.floor(p.speed),
      gear: p.gear,
      rpm: Math.floor(p.rpm),
      throttle: Math.floor(p.throttle),
      brake: p.brake,
      lap: Math.floor(sec / 90) + 1, // unchanged logic
    };
  }

  onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) this.driverSelected.emit(value);
  }

  onChangeDriver(): void {
    if (!this.confirmChange) {
      // First click → ask for confirmation
      this.confirmChange = true;
      return;
    }

    // Second click → actually clear
    this.confirmChange = false;
    this.clearDriver.emit();
  }

  private raceClockSpeed(): number {
    // mirror RaceClockService speeds
    return this.raceClock['speed'] ?? 1;
  }
  private getRaceSpeed(): number {
    // mirrors RaceClockService speeds
    return (this.raceClock as any).speed ?? 1;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
