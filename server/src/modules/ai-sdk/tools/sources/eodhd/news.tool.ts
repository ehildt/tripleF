import { tool } from 'ai';

import type { ToolDependencies } from '../types.js';

import { createEodhdClient, eodhdErrorResult } from './eodhd-tool.helper.js';
import { eodhdNewsSchema } from './news.schema.js';

/** Max snippet length sent to the model — the API returns full article bodies. */
const SNIPPET_MAX_CHARS = 280;

/** Publisher label from a link when the API does not provide one. */
function deriveSourceFromLink(link: string): string | undefined {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/** Cut at a word boundary, appending an ellipsis when truncated. */
function toSnippet(content?: string): string | undefined {
  if (!content) return undefined;
  if (content.length <= SNIPPET_MAX_CHARS) return content;
  const cut = content.slice(0, SNIPPET_MAX_CHARS);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), SNIPPET_MAX_CHARS / 2))}…`;
}

export function createEodhdNews(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch recent financial news for an EODHD ticker — headlines, links, sources, publish dates. Use to ground a stock-market answer in what is happening around a company (earnings, product news, macro, politics).',
    inputSchema: eodhdNewsSchema,
    execute: async ({ ticker, limit }) => {
      const client = createEodhdClient(deps, 'news');
      if (!client) {
        return {
          results: [],
          error: 'EODHD news is not enabled or no API key configured',
        };
      }
      try {
        const articles = await client.news(ticker, limit ?? 10);
        return {
          results: articles.map((a) => ({
            title: a.title,
            url: a.link,
            source: deriveSourceFromLink(a.link),
            date: a.date,
            snippet: toSnippet(a.content),
          })),
        };
      } catch (err) {
        return eodhdErrorResult(err);
      }
    },
  });
}
