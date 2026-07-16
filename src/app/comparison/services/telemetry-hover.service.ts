import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TelemetryHoverService {
  private hoverProgressSubject = new BehaviorSubject<number | null>(null);

  readonly hoverProgress$ = this.hoverProgressSubject.asObservable();

  setHoverProgress(progress: number | null) {
    this.hoverProgressSubject.next(progress);
  }

  get hoverProgress() {
    return this.hoverProgressSubject.value;
  }
}
