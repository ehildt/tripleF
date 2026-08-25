/**
 * Truncate text to `maxChars` with an ellipsis when it overflows. Returns the
 * text unchanged when it fits (or when `maxChars` is not positive).
 */
export function truncateText(text: string, maxChars: number): string {
  if (maxChars <= 0 || text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
}
