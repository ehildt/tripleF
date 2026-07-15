import { tool } from 'ai';
import { z } from 'zod';

import { fetchWithTimeout } from './fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';

export function createWebFetchTool() {
  return tool({
    description:
      'Fetch the full content of a specific URL. Use only when search snippets are insufficient.',
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch content from'),
    }),
    execute: async ({ url }: { url: string }) => {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CkirBot/1.0)',
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
