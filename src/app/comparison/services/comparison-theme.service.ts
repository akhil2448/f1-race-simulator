import { Injectable } from '@angular/core';

import { ComparisonTheme } from '../models/comparison-theme.model';

@Injectable({
  providedIn: 'root',
})
export class ComparisonThemeService {
  /**
   * Colors we can safely substitute when two drivers
   * have identical/similar team colors.
   */
  private readonly FALLBACK_COLORS = [
    '#FFFFFF',
    '#00E5FF',
    '#FFD400',
    '#FF4D6D',
    '#7CFF00',
  ];

  /**
   * Distance below which two colors are considered similar.
   */
  private readonly COLOR_DISTANCE_THRESHOLD = 80;

  buildTheme(driverAColor: string, driverBColor: string): ComparisonTheme {
    const colorA = this.normalize(driverAColor);
    const colorB = this.normalize(driverBColor);

    //
    // Colors are already distinct.
    //
    if (!this.areSimilar(colorA, colorB)) {
      return {
        driverA: {
          color: colorA,
          originalColor: colorA,
          usingFallback: false,
        },

        driverB: {
          color: colorB,
          originalColor: colorB,
          usingFallback: false,
        },
      };
    }

    //
    // Replace Driver B with a fallback color.
    //
    const replacement = this.pickFallback(colorA);

    return {
      driverA: {
        color: colorA,
        originalColor: colorA,
        usingFallback: false,
      },

      driverB: {
        color: replacement,
        originalColor: colorB,
        usingFallback: true,
      },
    };
  }

  /**
   * Ensures colors are '#RRGGBB'
   */
  private normalize(color: string): string {
    return color.startsWith('#') ? color : `#${color}`;
  }

  /**
   * Returns true when two colors are visually too close.
   */
  private areSimilar(a: string, b: string): boolean {
    const rgbA = this.hexToRgb(a);
    const rgbB = this.hexToRgb(b);

    const distance = Math.sqrt(
      Math.pow(rgbA.r - rgbB.r, 2) +
        Math.pow(rgbA.g - rgbB.g, 2) +
        Math.pow(rgbA.b - rgbB.b, 2),
    );

    return distance < this.COLOR_DISTANCE_THRESHOLD;
  }

  /**
   * Picks the first fallback color that is visually distinct.
   */
  private pickFallback(reference: string): string {
    for (const fallback of this.FALLBACK_COLORS) {
      if (!this.areSimilar(reference, fallback)) {
        return fallback;
      }
    }

    return '#FFFFFF';
  }

  private hexToRgb(hex: string) {
    const value = hex.replace('#', '');

    return {
      r: parseInt(value.substring(0, 2), 16),
      g: parseInt(value.substring(2, 4), 16),
      b: parseInt(value.substring(4, 6), 16),
    };
  }
}
