import { tool } from 'ai';
import { z } from 'zod';

import { dedupeByUrl } from './dedupe-by-url.js';
import { fetchWithTimeout } from './fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import { type ResultItem, sortByPriority } from './sort-by-priority.js';
import type { ToolDependencies } from './types.js';

async function searchBrave(
  query: string,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
  deps: ToolDependencies,
  allResults: ResultItem[],
): Promise<void> {
  if (!cfg.brave.enabled || !cfg.brave.apiKey || !cfg.brave.web.enabled) return;

  try {
    deps.logger.log(`Brave API search for "${query}"`);
    const count = cfg.brave.web.results;
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          'X-Subscription-Token': cfg.brave.apiKey,
          Accept: 'application/json',
        },
      },
      { timeoutMs: SEARCH_TIMEOUT_MS },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        web?: {
          results?: Array<{
            title: string;
            description: string;
            url: string;
          }>;
        };
      };
      if (data.web?.results?.length) {
        for (const r of data.web.results) {
          allResults.push({
            title: r.title,
            snippet: (r.description || '').slice(0, 300),
            url: r.url,
            source: 'brave',
          });
        }
        deps.logger.log(
          `Brave API returned ${data.web.results.length} results for "${query}"`,
        );
      }
    }
  } catch (err) {
    deps.logger.warn(`Brave search failed for "${query}": ${String(err)}`);
  }
}

async function searchSerper(
  query: string,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
  deps: ToolDependencies,
  allResults: ResultItem[],
): Promise<void> {
  if (!cfg.serper.enabled || !cfg.serper.apiKey || !cfg.serper.web.enabled)
    return;

  try {
    deps.logger.log(`Serper.dev search for "${query}"`);
    const res = await fetchWithTimeout(
      'https://google.serper.dev/search',
      {
        method: 'POST',
        headers: {
          'X-API-KEY': cfg.serper.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: cfg.serper.web.results }),
      },
      { timeoutMs: SEARCH_TIMEOUT_MS },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        organic?: Array<{ title: string; link: string; snippet: string }>;
      };
      if (data.organic?.length) {
        for (const r of data.organic) {
          allResults.push({
            title: r.title,
            snippet: (r.snippet || '').slice(0, 300),
            url: r.link,
            source: 'serper',
          });
        }
        deps.logger.log(
          `Serper.dev returned ${data.organic.length} results for "${query}"`,
        );
      }
    }
  } catch (err) {
    deps.logger.warn(`Serper search failed for "${query}": ${String(err)}`);
  }
}

function processSearxngResults(
  data: {
    results?: Array<{
      title?: string;
      content?: string;
      url?: string;
      engine?: string;
    }>;
  },
  braveCfg: { apiKey?: string },
  allResults: ResultItem[],
): number {
  if (!data.results?.length) return 0;

  let added = 0;
  for (const r of data.results) {
    if (!r.title || !r.url) continue;
    if (r.engine === 'brave' && braveCfg.apiKey) continue;
    allResults.push({
      title: r.title,
      snippet: (r.content || '').slice(0, 300),
      url: r.url,
      source: r.engine || 'searxng',
    });
    added++;
  }
  return added;
}

async function searchSearxng(
  query: string,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
  deps: ToolDependencies,
  allResults: ResultItem[],
): Promise<void> {
  if (!cfg.searxng.enabled || !cfg.searxng.url) return;

  try {
    deps.logger.log(`SearXNG search for "${query}"`);
    const url = `${cfg.searxng.url}/search?q=${encodeURIComponent(query)}&format=json`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: { 'X-Forwarded-For': '127.0.0.1' },
      },
      { timeoutMs: SEARCH_TIMEOUT_MS },
    );
    if (!res.ok) return;

    const data = (await res.json()) as {
      results?: Array<{
        title?: string;
        content?: string;
        url?: string;
        engine?: string;
      }>;
    };
    const added = processSearxngResults(data, cfg.brave, allResults);
    if (added) {
      deps.logger.log(`SearXNG returned ${added} results for "${query}"`);
    }
  } catch (err) {
    deps.logger.warn(`SearXNG search failed for "${query}": ${String(err)}`);
  }
}

function logBrowserbaseSkip(deps: ToolDependencies) {
  deps.logger.log(
    `Browserbase Search skipped in combined search (bare results without snippets). Use browserbaseSearch directly for URL discovery.`,
  );
}

export function createCombinedWebSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the web across all enabled search engines and return combined results.' +
      ' Use for general web search, research, and fact-finding.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    execute: async ({ query }: { query: string }) => {
      const cfg = deps.getLiveConfig();
      const allResults: ResultItem[] = [];

      await Promise.all([
        searchBrave(query, cfg, deps, allResults),
        searchSerper(query, cfg, deps, allResults),
        searchSearxng(query, cfg, deps, allResults),
      ]);

      if (
        cfg.browserBase.enabled &&
        cfg.browserBase.apiKey &&
        cfg.browserBase.search.enabled
      ) {
        logBrowserbaseSkip(deps);
      }

      const unique = dedupeByUrl(allResults);
      const sorted = sortByPriority(unique);

      deps.logger.log(
        `Combined web search: ${allResults.length} raw → ${sorted.length} unique for "${query}"`,
      );

      return { results: sorted };
    },
  });
}
