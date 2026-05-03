import { tool } from 'ai';
import { z } from 'zod';

import { fetchWithTimeout } from './fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import type { ToolDependencies } from './types.js';

export function createBrowserbaseSearchTool(deps: ToolDependencies) {
  return tool({
    description:
      'Search the web using Browserbase Search API. Returns ranked URLs with titles, author, and publication dates.\n' +
      'IMPORTANT: Results do NOT include text snippets or descriptions. Use this for discovering URLs, then scrape them with browserbaseFetch or webFetch to get content.',
    inputSchema: z.object({
      query: z.string().describe('The search query (1–200 characters)'),
      numResults: z
        .number()
        .optional()
        .default(10)
        .describe('Number of results to return (1–25)'),
    }),
    execute: async ({
      query,
      numResults,
    }: {
      query: string;
      numResults?: number;
    }) => {
      const cfg = deps.getLiveConfig().browserBase;
      if (!cfg.enabled || !cfg.apiKey) {
        return { results: [], error: 'Browserbase Search is not enabled' };
      }

      try {
        deps.logger.log(`Browserbase Search for "${query}"`);
        const count = Math.min(numResults ?? cfg.search.results, 25);

        const res = await fetchWithTimeout(
          'https://api.browserbase.com/v1/search',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-bb-api-key': cfg.apiKey,
            },
            body: JSON.stringify({ query, numResults: count }),
          },
          { timeoutMs: SEARCH_TIMEOUT_MS },
        );

        if (!res.ok) {
          deps.logger.warn(
            `Browserbase Search returned ${res.status} for "${query}"`,
          );
          return { results: [], error: `HTTP ${res.status}` };
        }

        const data = (await res.json()) as {
          requestId?: string;
          results?: Array<{
            id?: string;
            url: string;
            title: string;
            author?: string;
            publishedDate?: string;
            image?: string;
            favicon?: string;
          }>;
        };

        if (!data.results?.length) {
          deps.logger.warn(
            `Browserbase Search returned 0 results for "${query}"`,
          );
          return { results: [] };
        }

        const results = data.results.map((r) => ({
          title: r.title,
          url: r.url,
          id: r.id || '',
          author: r.author || '',
          publishedDate: r.publishedDate || '',
          image: r.image || '',
          favicon: r.favicon || '',
        }));

        deps.logger.log(
          `Browserbase Search returned ${results.length} results for "${query}"`,
        );

        return { results, requestId: data.requestId };
      } catch (err) {
        deps.logger.error(`Browserbase Search failed for "${query}":`, err);
        return { results: [], error: String(err) };
      }
    },
  });
}
