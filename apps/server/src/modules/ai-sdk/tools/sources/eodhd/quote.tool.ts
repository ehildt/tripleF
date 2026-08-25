import type { ToolDependencies } from '@triplef/agent/tools';
import { tool } from 'ai';

import { createEodhdClient, eodhdErrorResult } from './eodhd-tool.helper.js';
import { eodhdQuoteSchema } from './quote.schema.js';

export function createEodhdQuote(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch the current (delayed) quote for one or more EODHD tickers — last price, change, change %, open/high/low, volume, previous close. Use for a live snapshot of a stock, ETF, or index.',
    inputSchema: eodhdQuoteSchema,
    execute: async ({ tickers }) => {
      const client = createEodhdClient(deps, 'quote');
      if (!client) {
        return {
          results: [],
          error: 'EODHD quote is not enabled or no API key configured',
        };
      }
      try {
        const quotes = await client.quote(tickers);
        return { results: quotes };
      } catch (err) {
        return eodhdErrorResult(err);
      }
    },
  });
}
