/**
 * Radius + spacing scales. Base radius is 1rem (16px), matching the web
 * theme: sm = radius-6, md = radius-3, lg = radius, xl = radius+6, etc.
 */

export const radius = {
  sm: 10,
  md: 13,
  lg: 16,
  xl: 22,
  "2xl": 28,
  "3xl": 36,
  "4xl": 44,
  full: 9999,
} as const;

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  13: 52,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

/** Screen gutter used across app screens (px-5). */
export const gutter = spacing[5];

/** Max content width of the phone canvas. */
export const phoneWidth = 430;
