import type { RgbaColor } from './rgba-color.model';

/** Map an amount (0..100) to a green heat color. */
export function greenColor(amount: number): RgbaColor {
  const t = Math.max(0, Math.min(1, amount / 100));
  return {
    r: Math.round(41 + t * 214),
    g: Math.round(98 + t * (t < 0.5 ? 90 : 30)),
    b: Math.round(255 * (1 - t)),
    a: 0.35 + t * 0.65,
  };
}
