/**
 * Lighten a `#rrggbb` hex color toward white by `ratio` (0 = unchanged,
 * 1 = white). Used to render leaf dots a shade lighter than their cluster hub.
 */
export function lightenColor(hex: string, ratio: number): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const mix = (channel: number): number =>
    Math.round(channel + (255 - channel) * ratio);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
