import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackStatusComponent } from './track-status.component';

describe('TrackStatusComponent', () => {
  let component: TrackStatusComponent;
  let fixture: ComponentFixture<TrackStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
