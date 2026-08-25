import type { ToolDependencies } from '@triplef/agent/tools';
import { limitText } from '@triplef/helpers/limit-text';
import { tool } from 'ai';

import { createEodhdClient, eodhdErrorResult } from './eodhd-tool.helper.js';
import { eodhdNewsSchema } from './news.schema.js';

/** Publisher label from a link when the API does not provide one. */
function deriveSourceFromLink(link: string): string | undefined {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function createEodhdNews(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch recent financial news for an EODHD ticker — headlines, links, sources, publish dates. Use to ground a stock-market answer in what is happening around a company (earnings, product news, macro, politics).',
    inputSchema: eodhdNewsSchema,
    execute: async ({ ticker, limit }) => {
      const cfg = deps.getLiveConfig().eodhd;
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
            snippet: a.content
              ? limitText(a.content, cfg.news.snippetChars)
              : undefined,
          })),
        };
      } catch (err) {
        return eodhdErrorResult(err);
      }
    },
  });
}
