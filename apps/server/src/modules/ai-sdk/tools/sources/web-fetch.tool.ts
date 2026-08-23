import { tool } from 'ai';

import { fetchWithTimeout } from './fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import { type WebFetchInput, webFetchSchema } from './web-fetch.schema.js';

export function createWebFetchTool() {
  return tool({
    description:
      'Fetch the full content of a specific URL. Use only when search snippets are insufficient.',
    inputSchema: webFetchSchema,
    execute: async ({ url }: WebFetchInput) => {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TriplefBot/1.0)',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      const text = await response.text();
      const cleaned = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return { content: cleaned.slice(0, 8000) };
    },
  });
}
