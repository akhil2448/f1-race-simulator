import { Component, Input } from '@angular/core';
import { TelemetryCanvasComponent } from '../telemetry-canvas/telemetry-canvas.component';

@Component({
  selector: 'app-telemetry-panel',
  standalone: true,
  imports: [TelemetryCanvasComponent],
  templateUrl: './telemetry-panel.component.html',
  styleUrl: './telemetry-panel.component.scss',
})
export class TelemetryPanelComponent {
  @Input({ required: true })
  driverA: any;

  @Input()
  driverB: any;
}
