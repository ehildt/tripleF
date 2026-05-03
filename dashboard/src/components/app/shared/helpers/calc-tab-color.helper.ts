export function calcTabColor(tint: number): string {
  const restWeight = Math.round((1 - tint) * 100);
  return `color-mix(in srgb, var(--color-tab-rest) ${restWeight}%, var(--color-tab-accent))`;
}
