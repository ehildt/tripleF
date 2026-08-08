import { truncateToolResult } from '../sanitize/truncate-tool-result.helper.js';
import { isTrustedImageUrl } from '../url-trust/is-trusted-image-url.helper.js';

import type { ExtractedArticle } from './extract-articles-from-tools.types.js';
import type { ToolEntry } from './tool-entry.types.js';

/**
 * Determine the source name from a URL or raw provider slug.
 */
function deriveSourceName(url: string, rawSource?: string): string {
  const providerSlugs = new Set(['serper', 'brightData']);
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
 * Article-like context entry. `lang` starts unset and is filled later by
 * language tagging (see sanitize step) — upstream result payloads carry no
 * language flag except the dedicated YouTube search.
 */
/**
 * Extract article-like entries from search/fetch results. Deduplicates by URL.
 */
export function extractArticles(toolResults: ToolEntry[]): ExtractedArticle[] {
  const articles: ExtractedArticle[] = [];
  const seen = new Set<string>();

  for (const tr of toolResults) {
    // Shopping/reviews/places results are not articles — they are extracted
    // separately as first-class shopOffers/reviews/places context data.
    // Media searches (image/video) are not articles either: their results
    // are handled by the dedicated media pipelines, and letting them leak
    // into the article pools would re-surface media the video/image path
    // already filtered out (e.g. previously shown videos) as "articles".
    if (
      tr.toolName.endsWith('ShoppingSearch') ||
      tr.toolName.endsWith('ReviewsSearch') ||
      tr.toolName.endsWith('PlacesSearch') ||
      tr.toolName.endsWith('ImageSearch') ||
      tr.toolName.endsWith('VideoSearch')
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
function isSearchLikeTool(toolName: string): boolean {
  if (toolName.endsWith('ImageSearch') || toolName.endsWith('VideoSearch'))
    return true;
  if (toolName.endsWith('NewsSearch')) return true;
  if (toolName.endsWith('WebSearch')) return true;
  if (toolName.endsWith('ShoppingSearch') || toolName.endsWith('ReviewsSearch'))
    return true;
  if (toolName.endsWith('PlacesSearch')) return true;
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
