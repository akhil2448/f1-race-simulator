import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Subscription } from 'rxjs';

import {
  RaceControlService,
  RaceControlMessage,
} from '../../../core/services/race-control.service';

import { RaceClockService } from '../../../core/services/race-clock-service';

@Component({
  selector: 'app-race-control-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race-control-messages.component.html',
  styleUrls: ['./race-control-messages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceControlMessagesComponent implements OnInit, OnDestroy {
  @Input() year!: number;

  @Input() round!: number;

  currentMessage: RaceControlMessage | null = null;

  // Persistent banner state
  // Used ONLY for:
  // - startup GREEN
  // - CHEQUERED FLAG
  persistentMessage: RaceControlMessage | null = null;

  // FIFO display queue
  private queue: RaceControlMessage[] = [];

  // O(1) lookup
  private messagesBySecond = new Map<number, RaceControlMessage[]>();

  // prevent duplicate second processing
  private processedSeconds = new Set<number>();

  private sub?: Subscription;

  // queue processor state
  private isProcessing = false;

  // destroy safety
  private destroyed = false;

  // queue safety
  private readonly MAX_QUEUE_SIZE = 50;

  constructor(
    private raceClock: RaceClockService,
    private raceControl: RaceControlService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.raceControl.getRaceControl(this.year, this.round).subscribe((data) => {
      // preprocess into hashmap
      for (const msg of data.messages) {
        const existing = this.messagesBySecond.get(msg.raceSecond) ?? [];

        existing.push(msg);

        this.messagesBySecond.set(msg.raceSecond, existing);
      }

      // startup GREEN flag persistence
      const startupMessage = this.messagesBySecond.get(0)?.[0];

      if (startupMessage) {
        this.persistentMessage = startupMessage;

        this.cdr.markForCheck();
      }

      // subscribe AFTER preprocessing
      this.sub = this.raceClock.raceTime$.subscribe((raceSecond) => {
        // prevent duplicate processing
        if (this.processedSeconds.has(raceSecond)) {
          return;
        }

        this.processedSeconds.add(raceSecond);

        // hide startup GREEN
        // only after race actually starts
        if (raceSecond > 0 && this.persistentMessage?.flag === 'GREEN') {
          this.persistentMessage = null;

          this.cdr.markForCheck();
        }

        const messages = this.messagesBySecond.get(raceSecond);

        if (!messages?.length) {
          return;
        }

        for (const msg of messages) {
          // startup GREEN handled
          // via persistent banner only
          if (raceSecond === 0 && msg.flag === 'GREEN') {
            continue;
          }

          // permanent chequered flag
          if (msg.flag === 'CHEQUERED') {
            this.queue = [];

            this.currentMessage = null;

            this.persistentMessage = msg;

            this.cdr.markForCheck();

            return;
          }

          this.enqueueMessage(msg);
        }
      });
    });
  }

  private enqueueMessage(msg: RaceControlMessage): void {
    // queue protection
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('[RaceControl] Queue overflow prevented');

      return;
    }

    this.queue.push(msg);

    // start processor
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    // already running
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && !this.destroyed) {
      // dequeue next
      this.currentMessage = this.queue.shift()!;

      this.cdr.markForCheck();

      // display duration
      await this.delay(this.getMessageDuration(this.currentMessage));

      // clear current
      this.currentMessage = null;

      this.cdr.markForCheck();

      // small gap prevents layout thrash
      await this.delay(60);
    }

    this.isProcessing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private getMessageDuration(msg: RaceControlMessage): number {
    const base = 3000;

    const perCharacter = 45;

    const calculated = base + msg.message.length * perCharacter;

    return Math.min(Math.max(calculated, 3000), 8000);
  }

  get displayMessage(): RaceControlMessage | null {
    return this.currentMessage ?? this.persistentMessage;
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    this.sub?.unsubscribe();
  }
}
