import { tool } from 'ai';
import { z } from 'zod';

import { fetchWithTimeout } from './fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import type { ToolDependencies } from './types.js';

export function createSearXngSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the web using a self-hosted SearXNG instance. Returns ranked results with titles, snippets, and URLs.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    execute: async ({ query }: { query: string }) => {
      const cfg = deps.getLiveConfig().searxng;
      if (!cfg.url || !cfg.enabled) {
        return { results: [], error: 'SearXNG is not enabled' };
      }

      deps.logger.log(`SearXNG search for "${query}"`);
      const url = `${cfg.url}/search?q=${encodeURIComponent(query)}&format=json`;
      const res = await fetchWithTimeout(
        url,
        {
          headers: { 'X-Forwarded-For': '127.0.0.1' },
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [] };
      const data = (await res.json()) as {
        results?: Array<{
          title?: string;
          content?: string;
          url?: string;
          engine?: string;
        }>;
      };
      if (!data.results?.length) {
        deps.logger.warn(`SearXNG returned 0 results for "${query}"`);
        return { results: [] };
      }

      const braveCfg = deps.getLiveConfig().brave;
      const results = data.results
        .filter(
          (r) => r.title && r.url && !(r.engine === 'brave' && braveCfg.apiKey),
        )
        .map((r) => ({
          title: r.title!,
          snippet: (r.content || '').slice(0, 300),
          url: r.url!,
          source: r.engine || 'searxng',
        }));
      deps.logger.log(
        `SearXNG returned ${results.length} results for "${query}"`,
      );
      return { results };
    },
  });
}
