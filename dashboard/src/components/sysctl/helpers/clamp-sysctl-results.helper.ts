export function clampSysctlResults(value: number, max = 200): number {
  const parsed = Number.isFinite(value) ? value : 1;
  return Math.max(1, Math.min(max, parsed));
}
