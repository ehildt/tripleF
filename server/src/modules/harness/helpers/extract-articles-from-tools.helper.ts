import { isTrustedImageUrl } from './is-trusted-image-url.helper.js';
import { truncateToolResult } from './truncate-tool-result.helper.js';

type ToolEntry = { toolName: string; result: unknown };

/**
 * Determine the source name from a URL or raw provider slug.
 */
export function deriveSourceName(url: string, rawSource?: string): string {
  const providerSlugs = new Set(['serper']);
  if (rawSource && !providerSlugs.has(rawSource.toLowerCase()))
    return rawSource;

  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const commonSubdomains = new Set(['news', 'blog', 'amp', 'm', 'www']);
      if (commonSubdomains.has(parts[0])) return parts[1];
    }
    return parts[0] || hostname;
  } catch {
    return rawSource || '';
  }
}

/**
 * Extract article-like entries from search/fetch results. Deduplicates by URL.
 */
export function extractArticles(
  toolResults: ToolEntry[],
): Array<Record<string, unknown>> {
  const articles: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();

  for (const tr of toolResults) {
    // Shopping/reviews/places results are not articles — they are extracted
    // separately as first-class shopOffers/reviews/places context data.
    if (
      tr.toolName.endsWith('ShoppingSearch') ||
      tr.toolName.endsWith('ReviewsSearch') ||
      tr.toolName.endsWith('PlacesSearch')
    ) {
      continue;
    }

    const data = tr.result as
      | {
          results?: Array<{
            title?: string;
            snippet?: string;
            url?: string;
            source?: string;
            date?: string;
            description?: string;
            link?: string;
            imageUrl?: string;
          }>;
        }
      | undefined;
    if (!data?.results) continue;

    for (const r of data.results) {
      const url = r.url || r.link;
      if (!url || seen.has(url)) continue;
      seen.add(url);

      articles.push({
        title: r.title || '',
        snippet: r.snippet || r.description || '',
        url,
        sourceName: deriveSourceName(url, r.source),
        date: r.date || '',
        imageUrl: isTrustedImageUrl(r.imageUrl || '') ? r.imageUrl : '',
      });
    }
  }

  return articles;
}

/**
 * Tools whose results are not suitable as references (search-like tools return lists of links;
 * we want full content like fetched pages).
 */
export function isSearchLikeTool(toolName: string): boolean {
  if (toolName.endsWith('ImageSearch') || toolName.endsWith('VideoSearch'))
    return true;
  if (toolName.endsWith('NewsSearch')) return true;
  if (toolName === 'webSearch' || toolName.endsWith('WebSearch')) return true;
  if (toolName.endsWith('ShoppingSearch') || toolName.endsWith('ReviewsSearch'))
    return true;
  if (toolName.endsWith('PlacesSearch')) return true;
  if (toolName === 'wikipediaSearch') return true;
  if (toolName === 'hackerNewsSearch') return true;
  return false;
}

/**
 * Extract non-search tool results as references for the response model.
 */
export function extractReferences(toolResults: ToolEntry[]): unknown[] {
  return toolResults
    .filter((tr) => !isSearchLikeTool(tr.toolName))
    .map((tr) => truncateToolResult(tr.result));
}
