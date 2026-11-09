/** Parse persisted counter visibility; a missing value remains disabled. */
export function parseShowCounters(saved: string | null): boolean {
  return saved === 'true';
}
