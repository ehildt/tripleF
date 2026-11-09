/** Parse a cognition id, using the default for missing or blank values. */
export function parseMemoryCognition(saved: string | null): string {
  return saved?.trim() || 'default';
}
