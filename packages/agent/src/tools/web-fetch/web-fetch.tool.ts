import { type Tool, tool } from 'ai';

import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';
import { fetchWithTimeout } from '../helpers/fetch-with-timeout.js';

import { extractArticleText } from './extract-article-text.helper.js';
import { type WebFetchInput, webFetchSchema } from './web-fetch.schema.js';

export function createWebFetchTool(): Tool {
  return tool({
    description:
      'Fetch the full content of a specific URL (e.g. a search result page). Returns the main article text as Markdown (boilerplate removed). Prefer fetching the most relevant search results to ground the answer in full source text.',
    inputSchema: webFetchSchema,
    execute: async ({ url }: WebFetchInput) => {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TriplefBot/1.0)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      const html = await response.text();
      return { url, content: extractArticleText(html) };
    },
  });
}
