/**
 * Truncate a tool result to avoid exceeding token limits.
 */
export function truncateToolResult(result: unknown, maxChars = 8000): unknown {
  if (result === null || result === undefined) return result;
  if (typeof result !== 'object') return result;

  try {
    const text = JSON.stringify(result);
    if (text.length <= maxChars) return result;
    return { note: 'Tool result truncated', preview: text.slice(0, maxChars) };
  } catch {
    return result;
  }
}
