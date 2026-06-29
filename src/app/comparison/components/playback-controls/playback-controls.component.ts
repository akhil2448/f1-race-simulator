import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-playback-controls',
  standalone: true,
  templateUrl: './playback-controls.component.html',
  styleUrl: './playback-controls.component.scss',
})
export class PlaybackControlsComponent {
  @Input()
  progress = 0;

  @Input()
  playing = false;

  @Input()
  playbackRate = 1;

  @Input()
  currentTime = 0;

  @Input()
  totalTime = 0;

  @Output()
  playPause = new EventEmitter<void>();

  @Output()
  stepForward = new EventEmitter<void>();

  @Output()
  stepBackward = new EventEmitter<void>();

  @Output()
  progressChanged = new EventEmitter<number>();

  @Output()
  playbackRateChanged = new EventEmitter<number>();

  onSliderInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);

    this.progressChanged.emit(value / 1000);
  }

  setRate(rate: number): void {
    this.playbackRateChanged.emit(rate);
  }

  format(seconds: number): string {
    const mins = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    const millis = Math.floor((seconds % 1) * 1000);

    return `${mins}:${secs.toString().padStart(2, '0')}.${millis
      .toString()
      .padStart(3, '0')}`;
  }
}
