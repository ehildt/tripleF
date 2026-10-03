import type { RgbaColor } from './rgba-color.model';

/** Serialize an RGBA color to CSS `rgba()` notation. */
export function formatRgba(c: RgbaColor): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}
