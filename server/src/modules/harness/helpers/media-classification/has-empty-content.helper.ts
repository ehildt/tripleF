/** A zero content-length on a 2xx response means there is nothing to show. */
export function hasEmptyContent(headers: Record<string, unknown>): boolean {
  const raw = headers['content-length'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  return Number(value) === 0;
}
