export interface PlaybackSample {
  rd: number;

  t: number;

  d: number;

  x: number;
  y: number;

  speed: number;
  rpm: number;

  throttle: number;
  brake: number;

  gear: number;
}

export interface PlaybackDriverFrame {
  sample: PlaybackSample;

  elapsedTime: number;
}

export interface PlaybackFrame {
  /**
   * Normalized lap progress (0 -> 1)
   */
  progress: number;

  /**
   * Previous telemetry sample.
   *
   * (Kept temporarily for backwards compatibility.)
   */
  previous: any;

  /**
   * Next telemetry sample.
   *
   * (Kept temporarily for backwards compatibility.)
   */
  next: any;

  /**
   * Interpolation factor.
   *
   * (Kept temporarily for backwards compatibility.)
   */
  factor: number;

  /**
   * Driver A playback frame.
   */
  driverA?: PlaybackDriverFrame;

  /**
   * Driver B playback frame.
   */
  driverB?: PlaybackDriverFrame | null;

  /**
   * Legacy sample.
   *
   * This stays until every component has been migrated.
   */
  sample: PlaybackSample;
}
