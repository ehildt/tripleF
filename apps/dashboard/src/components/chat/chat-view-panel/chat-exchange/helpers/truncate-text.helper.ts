/**
 * Truncate text to a maximum length, breaking at the last space.
 */
export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max + 1);
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > 0) return text.slice(0, lastSpace);
  return text.slice(0, max);
}
