import type { RgbaColor } from './rgba-color.model';

/** Map an amount (0..100) to a purple/violet heat color. */
export function purpleColor(amount: number): RgbaColor {
  const t = Math.max(0, Math.min(1, amount / 100));
  return {
    r: Math.round(40 + t * 200),
    g: Math.round(10 + t * 80),
    b: Math.round(90 + t * 165),
    a: 0.3 + t * 0.7,
  };
}
