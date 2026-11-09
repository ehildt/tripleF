/** Normalize a user-entered retention value to a non-negative whole number of minutes. */
export function normalizeTemporaryRetentionMinutes(minutes: number): number {
  return Math.max(0, Math.floor(Number.isFinite(minutes) ? minutes : 0));
}
