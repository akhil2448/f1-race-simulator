import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualifyingComparisonPageComponent } from './qualifying-comparison-page.component';

describe('QualifyingComparisonPageComponent', () => {
  let component: QualifyingComparisonPageComponent;
  let fixture: ComponentFixture<QualifyingComparisonPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualifyingComparisonPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QualifyingComparisonPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
