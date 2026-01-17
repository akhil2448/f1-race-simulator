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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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

  @Output() driverSelected = new EventEmitter<string>();
  @Output() clearDriver = new EventEmitter<void>();

  telemetry: DriverTelemetryView | null = null;

  @Input() teamColor: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private raceClock: RaceClockService,
    private buffer: DriverTelemetryBufferService,
  ) {
    this.raceClock.raceTime$.pipe(takeUntil(this.destroy$)).subscribe((sec) => {
      if (!this.selectedDriver) return;

      const p = this.buffer.getSampleAt(sec);
      if (!p) return;

      this.telemetry = this.mapTelemetry(p, sec);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedDriver']) {
      if (!this.selectedDriver) {
        this.buffer.clear();
        this.telemetry = null;
        return;
      }

      const now = this.raceClock.getCurrentSecond();
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
      lap: Math.floor(sec / 90) + 1,
    };
  }

  onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) this.driverSelected.emit(value);
  }

  onChangeDriver(): void {
    this.clearDriver.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
