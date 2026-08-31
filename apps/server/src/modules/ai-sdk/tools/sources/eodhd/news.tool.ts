import type { ToolDependencies } from '@triplef/agent/tools';
import { tool } from 'ai';

import { mapEodhdNewsToResult } from './helpers/map-eodhd-news-to-result.helper.js';
import { createEodhdClient, eodhdErrorResult } from './eodhd-tool.helper.js';
import { eodhdNewsSchema } from './news.schema.js';

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
          results: articles.map((a) =>
            mapEodhdNewsToResult(a, cfg.news.snippetChars),
          ),
        };
      } catch (err) {
        return eodhdErrorResult(err);
      }
    },
  });
}
