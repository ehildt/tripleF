import type { RgbaColor } from './rgba-color.model';

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
