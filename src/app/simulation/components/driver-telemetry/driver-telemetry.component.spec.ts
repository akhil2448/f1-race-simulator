import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverTelemetryComponent } from './driver-telemetry.component';

describe('DriverTelemetryComponent', () => {
  let component: DriverTelemetryComponent;
  let fixture: ComponentFixture<DriverTelemetryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverTelemetryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverTelemetryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
