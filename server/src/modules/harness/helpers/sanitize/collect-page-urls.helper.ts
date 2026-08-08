import type { ToolResult } from './tool-result.types.js';

/** Article/page URLs from web and news search results. */
export function collectPageUrls(toolResults: ToolResult[]): string[] {
  const urls = new Set<string>();

  for (const tr of toolResults) {
    if (
      !tr.toolName.endsWith('WebSearch') &&
      !tr.toolName.endsWith('NewsSearch')
    )
      continue;

    const data = tr.result as
      { results?: Array<{ url?: string; link?: string }> } | undefined;
    if (!data?.results) continue;

    for (const r of data.results) {
      const url = [r.url, r.link].find(
        (candidate): candidate is string =>
          typeof candidate === 'string' && !!candidate.trim(),
      );
      if (url) urls.add(url.trim());
    }
  }

  return Array.from(urls);
}
