/** Check whether a value looks like a masked key, not a real one. */
export function isMaskedApiKey(value: unknown): boolean {
  return typeof value === 'string' && value.includes('****');
}
