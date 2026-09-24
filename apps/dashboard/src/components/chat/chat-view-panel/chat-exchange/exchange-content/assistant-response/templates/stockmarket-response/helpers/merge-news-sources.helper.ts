import type {
  Source,
  StockmarketNewsItem,
} from '@/types/harness-response-data.model';

/** Normalize a URL (or title, when no URL) so the same link counts once. */
function keyOf(url: string | undefined, title: string | undefined): string {
  let normalized = (url ?? '').trim().toLowerCase();
  while (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return normalized || (title ?? '').trim().toLowerCase();
}

/**
 * Merge news items and sources into a single deduplicated list of the shared
 * `Source` shape, so the stockmarket card renders it with the same
 * SourcesSection every other template uses. News entries win when a URL
 * appears in both (they carry source attribution and a date); sources fill
 * in anything news does not cover.
 */
export function mergeNewsSources(
  news: StockmarketNewsItem[] | undefined,
  sources: Source[] | undefined,
): Source[] {
  const entries = new Map<string, Source>();

  for (const item of news ?? []) {
    const key = keyOf(item.url, item.title);
    if (!key) continue;
    entries.set(key, {
      title: item.title || item.url || '',
      url: item.url,
      sourceName: item.source,
    });
  }

  for (const item of sources ?? []) {
    const key = keyOf(item.url, item.title);
    if (!key || entries.has(key)) continue;
    entries.set(key, {
      title: item.title || item.url || '',
      url: item.url,
      sourceName: item.sourceName,
    });
  }

  return [...entries.values()];
}
