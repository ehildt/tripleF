/**
 * Extract the `query` string from a tool call input object.
 * Returns empty string if no query is found.
 */
export function getToolCallQuery(input: unknown): string {
  if (typeof input === 'object' && input !== null && 'query' in input) {
    const q = (input as Record<string, unknown>).query;
    return typeof q === 'string' ? q : '';
  }
  return '';
}
