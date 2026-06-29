export interface DriverTheme {
  /**
   * Display color used everywhere for this driver.
   */
  color: string;

  /**
   * Original team accent color from the API.
   */
  originalColor: string;

  /**
   * True when we had to replace the team color because
   * both drivers had identical/similar colors.
   */
  usingFallback: boolean;
}

export interface ComparisonTheme {
  driverA: DriverTheme;
  driverB: DriverTheme;
}
