/**
 * Map a 0..1 value to a perceptually monotonic cool→warm ramp (0 = cool
 * blue, 1 = warm orange-red). Used for the link-count heat gradient: hubs
 * glow warm, isolated dots stay cool.
 */
export function heatColor(t: number): string {
  const v = Math.max(0, Math.min(1, t));
  const stops = [
    [56, 130, 220], // cool blue
    [170, 130, 200], // muted lavender bridge
    [240, 100, 60], // warm orange-red
  ];
  const seg = v * (stops.length - 1);
  const i = Math.min(Math.floor(seg), stops.length - 2);
  const frac = seg - i;
  const a = stops[i];
  const b = stops[i + 1];
  const r = Math.round(a[0] + (b[0] - a[0]) * frac);
  const g = Math.round(a[1] + (b[1] - a[1]) * frac);
  const bl = Math.round(a[2] + (b[2] - a[2]) * frac);
  return `rgb(${r},${g},${bl})`;
}
