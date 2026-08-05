import { tool } from 'ai';
import { z } from 'zod';

import { fetchWithTimeout } from '../fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from '../search-timeout.js';
import type { ToolDependencies } from '../types.js';

import { HEADERS } from './serper.constants.js';

export function createSerperWebpageScrape(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch and render a full webpage using Serper.dev scrape API. Returns clean rendered text with its title.',
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch and render'),
    }),
    execute: async ({ url }: { url: string }) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.apiKey || !cfg.scrape.enabled) {
        return {
          content: '',
          error: 'Serper.dev webpage scrape is not enabled',
        };
      }

      deps.logger.log(`Serper.dev Webpage scrape for "${url}"`);
      const res = await fetchWithTimeout(
        'https://scrape.serper.dev',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify({ url }),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) {
        deps.logger.warn(
          `Serper.dev Webpage scrape returned ${res.status} for "${url}"`,
        );
        return { content: '', error: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as { text?: string; title?: string };
      const content = data.text || '';
      const title = data.title || '';
      deps.logger.log(
        `Serper.dev Webpage scraped ${content.length} chars from "${url}"`,
      );
      return { content: content.slice(0, 8000), title };
    },
  });
}
