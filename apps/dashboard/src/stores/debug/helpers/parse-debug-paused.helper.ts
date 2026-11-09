/** Parse the pause preference: logging is paused unless explicitly enabled. */
export function parseDebugPaused(saved: string | null): boolean {
  return saved !== 'false';
}
