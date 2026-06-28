export interface PlaybackFrame {
  /**
   * Normalized lap progress (0 -> 1)
   */
  progress: number;

  /**
   * Previous telemetry sample.
   */
  previous: any;

  /**
   * Next telemetry sample.
   */
  next: any;

  /**
   * Interpolation factor (0 -> 1)
   */
  factor: number;

  /**
   * Interpolated telemetry values.
   */
  sample: {
    rd: number;

    d: number;

    x: number;
    y: number;

    speed: number;
    rpm: number;

    throttle: number;
    brake: number;

    gear: number;
  };
}
