/** Extract a normalized (lowercased, no params) content-type from response headers. */
export function extractContentType(
  headers: Record<string, unknown>,
): string | undefined {
  const value = headers['content-type'];
  if (typeof value === 'string')
    return value.split(';')[0].trim().toLowerCase();
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === 'string'
  ) {
    return value[0].split(';')[0].trim().toLowerCase();
  }
  return undefined;
}
