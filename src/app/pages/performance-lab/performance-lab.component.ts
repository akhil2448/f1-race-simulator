import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DriverSelectionComponent } from './components/ driver-selection/driver-selection.component';

type AnalysisMode = 'ultimate' | 'race';

@Component({
  selector: 'app-performance-lab',
  standalone: true,
  imports: [CommonModule, DriverSelectionComponent],
  templateUrl: './performance-lab.component.html',
  styleUrl: './performance-lab.component.scss',
})
export class PerformanceLabComponent {
  mode: AnalysisMode = 'ultimate';

  toggleMode(mode: AnalysisMode): void {
    this.mode = mode;
  }
}
