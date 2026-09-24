/** RGBA color components (0..255 for rgb, 0..1 for alpha). */
export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function formatRgba(c: RgbaColor): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

/** Turbo / inferno rainbow, matching the plugin example's colormap. */
export function turboColor(amount: number): RgbaColor {
  const c = Math.max(0, Math.min(1, amount / 100));
  const r = Math.round(
    34.61 +
      c *
        (1172.33 -
          c * (10793.56 - c * (33300.12 - c * (38394.49 - c * 14825.05)))),
  );
  const g = Math.round(
    23.31 +
      c * (557.33 + c * (1225.33 - c * (3574.96 - c * (1073.77 + c * 707.56)))),
  );
  const b = Math.round(
    27.2 +
      c *
        (3211.1 - c * (15327.97 - c * (27814 - c * (22569.18 - c * 6838.66)))),
  );
  return { r, g, b, a: 1 };
}

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
