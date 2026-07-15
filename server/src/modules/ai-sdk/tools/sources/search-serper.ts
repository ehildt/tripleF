import { fetchWithTimeout } from './fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import type { ResultItem } from './sort-by-priority.js';
import type { ToolDependencies } from './types.js';

export async function searchSerper(
  query: string,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
  deps: ToolDependencies,
  allResults: ResultItem[],
  lang?: string,
): Promise<void> {
  if (!cfg.serper.enabled || !cfg.serper.apiKey || !cfg.serper.web.enabled)
    return;

  try {
    deps.logger.log(`Serper.dev search for "${query}"`);
    const payload: Record<string, unknown> = {
      q: query,
      num: cfg.serper.web.results,
      ...(lang ? { hl: lang, gl: lang } : {}),
    };

    const res = await fetchWithTimeout(
      'https://google.serper.dev/search',
      {
        method: 'POST',
        headers: {
          'X-API-KEY': cfg.serper.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      { timeoutMs: SEARCH_TIMEOUT_MS },
    );

    if (!res.ok) return;

    const data = (await res.json()) as {
      organic?: Array<{ title: string; link: string; snippet: string }>;
    };

    if (!data.organic?.length) return;

    for (const r of data.organic)
      allResults.push({
        title: r.title,
        snippet: (r.snippet || '').slice(0, 300),
        url: r.link,
        source: 'serper',
      });

    deps.logger.log(
      `Serper.dev returned ${data.organic.length} results for "${query}"`,
    );
  } catch (err) {
    deps.logger.warn(`Serper search failed for "${query}": ${String(err)}`);
  }
}
