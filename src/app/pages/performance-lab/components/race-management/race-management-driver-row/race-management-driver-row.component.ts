import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RaceManagementDriver } from '../../../models/performance-lab.model';

@Component({
  selector: 'app-race-management-driver-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-management-driver-row.component.html',
  styleUrl: './race-management-driver-row.component.scss',
})
export class RaceManagementDriverRowComponent {
  @Input({ required: true })
  driver!: RaceManagementDriver;

  @Input({ required: true })
  totalRaceLaps!: number;

  @Output()
  driverSelected = new EventEmitter<RaceManagementDriver>();

  selectDriver(): void {
    this.driverSelected.emit(this.driver);
  }

  stintWidth(lapCount: number): number {
    return (lapCount / this.totalRaceLaps) * 100;
  }

  tyreClass(compound: string): string {
    return compound.toLowerCase();
  }

  isLast(index: number): boolean {
    return index === this.driver.stints.length - 1;
  }
}
