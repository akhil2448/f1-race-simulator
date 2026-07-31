import { Component, EventEmitter, Output, OnInit } from '@angular/core';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  templateUrl: './splash-screen.component.html',
  styleUrl: './splash-screen.component.scss',
})
export class SplashScreenComponent implements OnInit {
  @Output() finished = new EventEmitter<void>();

  visible = true;
  animate = false;
  fadeOut = false;

  ngOnInit(): void {
    requestAnimationFrame(() => {
      this.animate = true;
    });

    setTimeout(() => {
      this.fadeOut = true;
    }, 1100);

    setTimeout(() => {
      this.visible = false;
      this.finished.emit();
    }, 1350);
  }
}
