import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingOverlayService {
  private visibleSubject = new BehaviorSubject<boolean>(false);

  private messageSubject = new BehaviorSubject<string>('Loading...');

  visible$ = this.visibleSubject.asObservable();

  message$ = this.messageSubject.asObservable();

  show(message: string = 'Loading...'): void {
    this.messageSubject.next(message);

    this.visibleSubject.next(true);
  }

  hide(): void {
    this.visibleSubject.next(false);
  }
}
