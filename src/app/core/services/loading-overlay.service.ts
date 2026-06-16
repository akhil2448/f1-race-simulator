import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingOverlayService {
  private visibleSubject = new BehaviorSubject<boolean>(false);

  visible$ = this.visibleSubject.asObservable();

  show(): void {
    this.visibleSubject.next(true);
  }

  hide(): void {
    this.visibleSubject.next(false);
  }
}
