import { Component, Input } from '@angular/core';
import { TelemetryGraphComponent } from '../telemetry-graph/telemetry-graph.component';

@Component({
  selector: 'app-telemetry-panel',
  standalone: true,
  imports: [TelemetryGraphComponent],
  templateUrl: './telemetry-panel.component.html',
  styleUrl: './telemetry-panel.component.scss',
})
export class TelemetryPanelComponent {
  @Input({ required: true })
  driverA: any;

  @Input()
  driverB: any;
}
