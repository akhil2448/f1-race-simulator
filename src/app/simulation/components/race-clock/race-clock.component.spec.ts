import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceClockComponent } from './race-clock.component';

describe('RaceClockComponent', () => {
  let component: RaceClockComponent;
  let fixture: ComponentFixture<RaceClockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaceClockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaceClockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
