/** Normalize a URL (or title, when no URL) so the same link counts once. */
export function keyOf(
  url: string | undefined,
  title: string | undefined,
): string {
  let normalized = (url ?? '').trim().toLowerCase();
  while (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return normalized || (title ?? '').trim().toLowerCase();
}
