import type { ToolResult } from '@triplef/ai-sdk';

/** Search tools whose results carry article URLs worth fetching. */
const SEARCH_TOOL_NAMES = [
  'serperWebSearch',
  'brightDataWebSearch',
  'serperNewsSearch',
  'brightDataNewsSearch',
] as const;

/** Tools that already fetch full page content (the model opted in). */
const FETCH_TOOL_NAMES = [
  'webFetch',
  'serperWebpageScrape',
  'brightDataWebpageScrape',
  'browser_navigate',
] as const;

/**
 * Deterministic auto-fetch fallback: when the model selected a search tool
 * but NO fetch tool, collect the top search-result URLs (up to `maxUrls`) so
 * the harness can fetch them and ground the answer in full source text.
 * Returns an empty list when the model already opted to fetch, or when the
 * search results carry no URLs.
 */
export function collectAutoFetchUrls(
  selectedTools: readonly string[],
  toolResults: readonly ToolResult[],
  maxUrls: number,
): string[] {
  const hasSearch = selectedTools.some((tool) =>
    (SEARCH_TOOL_NAMES as readonly string[]).includes(tool),
  );
  const hasFetch = selectedTools.some((tool) =>
    (FETCH_TOOL_NAMES as readonly string[]).includes(tool),
  );
  if (!hasSearch || hasFetch) return [];

  const urls: string[] = [];
  for (const result of toolResults) {
    if (!(SEARCH_TOOL_NAMES as readonly string[]).includes(result.toolName)) {
      continue;
    }
    const data = result.result as
      { results?: Array<{ url?: string }> } | undefined;
    for (const item of data?.results ?? []) {
      if (typeof item.url !== 'string' || !item.url) continue;
      if (urls.includes(item.url)) continue;
      urls.push(item.url);
      if (urls.length >= maxUrls) return urls;
    }
  }
  return urls;
}
