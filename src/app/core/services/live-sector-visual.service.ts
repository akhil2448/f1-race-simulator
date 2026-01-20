import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LiveTimingService } from './live-timing.service';
import { LiveDriverState } from '../models/live-driver-state.model';

@Injectable({ providedIn: 'root' })
export class LiveSectorVisualService {
  private subject = new BehaviorSubject<LiveDriverState[]>([]);
  visualState$ = this.subject.asObservable();

  constructor(private timing: LiveTimingService) {
    this.bind();
  }

  private bind(): void {
    this.timing.state$.subscribe((states) => {
      // 🔒 VISUAL SERVICE IS READ-ONLY
      // No sector logic
      // No gap logic
      // No lap logic
      // Just mirror authoritative timing state
      this.subject.next(states);
    });
  }
}
