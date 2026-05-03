import { tool } from 'ai';
import { z } from 'zod';

import { fetchWithTimeout } from './fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import type { ToolDependencies } from './types.js';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000;

export function createBrowserbaseFetchTool(deps: ToolDependencies) {
  return tool({
    description:
      'Scrape a webpage using Browserbase cloud browser. Renders JavaScript, handles bot protection, and returns page content as markdown, raw HTML, or structured JSON.\n' +
      "Use this when the user's request requires reading a specific URL that needs full browser rendering (JavaScript-heavy pages, protected sites). For simple static pages, webFetch is faster.",
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch'),
    }),
    execute: async ({ url }: { url: string }) => {
      const cfg = deps.getLiveConfig().browserBase;
      if (!cfg.enabled || !cfg.apiKey || !cfg.fetch.enabled) {
        return { content: '', error: 'Browserbase Fetch is not enabled' };
      }

      let lastError: string | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          deps.logger.log(
            `Browserbase Scrape (attempt ${attempt + 1}) for "${url}"`,
          );

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
                format: cfg.fetch.format,
                proxies: cfg.fetch.proxies,
              }),
            },
            { timeoutMs: SEARCH_TIMEOUT_MS },
          );

          if (res.status === 429) {
            lastError = 'Rate limited';
            const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
            deps.logger.warn(
              `Browserbase Fetch rate limited for "${url}", retrying in ${delay}ms`,
            );
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          if (!res.ok) {
            const body = await res.text().catch(() => '');
            deps.logger.warn(
              `Browserbase Fetch returned ${res.status} for "${url}": ${body.slice(0, 200)}`,
            );
            return { content: '', error: `HTTP ${res.status}` };
          }

          const data = (await res.json()) as {
            statusCode?: number;
            content?: string;
            contentType?: string;
          };

          deps.logger.log(
            `Browserbase Fetch succeeded for "${url}" (${data.content?.length ?? 0} chars)`,
          );

          return {
            content: data.content ?? '',
            statusCode: data.statusCode,
            contentType: data.contentType,
          };
        } catch (err) {
          lastError = String(err);
          deps.logger.warn(
            `Browserbase Fetch attempt ${attempt + 1} failed for "${url}": ${lastError}`,
          );
          if (attempt < MAX_RETRIES - 1) {
            const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }

      return { content: '', error: lastError ?? 'All retries exhausted' };
    },
  });
}
