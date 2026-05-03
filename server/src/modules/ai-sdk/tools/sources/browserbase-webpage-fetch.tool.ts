import { tool } from 'ai';
import { z } from 'zod';

import { fetchWithTimeout } from './fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import type { ToolDependencies } from './types.js';

/**
 * Dedicated webpage-scrape tool that mirrors Serper's webpageFetch.
 * Uses Browserbase /v1/fetch with markdown output for clean rendered text.
 */
export function createBrowserbaseWebpageFetch(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch and render a full webpage using Browserbase cloud browser. ' +
      'Returns clean rendered text (markdown) with its title. ' +
      'Use when you need to read the content of a specific URL that may require JavaScript rendering or bot-protection handling.',
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch and render'),
    }),
    execute: async ({ url }: { url: string }) => {
      const cfg = deps.getLiveConfig().browserBase;
      if (!cfg.enabled || !cfg.apiKey || !cfg.fetch.enabled) {
        return {
          content: '',
          error: 'Browserbase webpage fetch is not enabled',
        };
      }

      try {
        deps.logger.log(`Browserbase Webpage scrape for "${url}"`);
        const res = await fetchWithTimeout(
          'https://api.browserbase.com/v1/fetch',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-BB-API-Key': cfg.apiKey,
            },
            body: JSON.stringify({
              url,
              format: 'markdown',
              proxies: cfg.fetch.proxies,
            }),
          },
          { timeoutMs: SEARCH_TIMEOUT_MS },
        );

        if (!res.ok) {
          deps.logger.warn(
            `Browserbase Webpage scrape returned ${res.status} for "${url}"`,
          );
          return { content: '', error: `HTTP ${res.status}` };
        }

        const data = (await res.json()) as {
          content?: string;
          statusCode?: number;
          contentType?: string;
        };

        const content = data.content ?? '';
        deps.logger.log(
          `Browserbase Webpage scraped ${content.length} chars from "${url}"`,
        );

        return {
          content: content.slice(0, 8000),
          statusCode: data.statusCode,
          contentType: data.contentType,
        };
      } catch (err) {
        deps.logger.error(
          `Browserbase Webpage scrape failed for "${url}":`,
          err,
        );
        return { content: '', error: String(err) };
      }
    },
  });
}
