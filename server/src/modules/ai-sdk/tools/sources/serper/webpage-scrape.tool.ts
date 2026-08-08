import { tool } from 'ai';

import { fetchWithTimeout } from '../fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from '../search-timeout.js';
import type { ToolDependencies } from '../types.js';

import { HEADERS } from './serper.constants.js';
import {
  type SerperWebpageScrapeInput,
  serperWebpageScrapeSchema,
} from './webpage-scrape.schema.js';
import type { SerperWebpageScrapeResponse } from './webpage-scrape.types.js';

export function createSerperWebpageScrape(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch and render a full webpage using Serper.dev scrape API. Returns clean rendered text with its title.',
    inputSchema: serperWebpageScrapeSchema,
    execute: async ({ url }: SerperWebpageScrapeInput) => {
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
      const data = (await res.json()) as SerperWebpageScrapeResponse;
      const content = data.text || '';
      const title = data.title || '';
      deps.logger.log(
        `Serper.dev Webpage scraped ${content.length} chars from "${url}"`,
      );
      return { content: content.slice(0, 8000), title };
    },
  });
}
