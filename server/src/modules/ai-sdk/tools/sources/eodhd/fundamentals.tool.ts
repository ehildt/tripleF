import { tool } from 'ai';

import type { ToolDependencies } from '../types.js';

import { createEodhdClient, eodhdErrorResult } from './eodhd-tool.helper.js';
import { eodhdFundamentalsSchema } from './fundamentals.schema.js';

export function createEodhdFundamentals(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch company fundamentals for an EODHD ticker — general info, valuation, and key financial highlights. Use for a stock-market item to add company context (sector, market cap, P/E, revenue, margins).',
    inputSchema: eodhdFundamentalsSchema,
    execute: async ({ ticker }) => {
      const client = createEodhdClient(deps, 'fundamentals');
      if (!client) {
        return {
          summary: { ticker },
          error: 'EODHD fundamentals is not enabled or no API key configured',
        };
      }
      try {
        const fundamentals = await client.fundamentals(ticker);
        const general = fundamentals.general ?? {};
        const highlights = fundamentals.highlights ?? {};
        const valuation = fundamentals.valuation ?? {};
        return {
          summary: {
            ticker,
            name: general.Name,
            sector: general.Sector,
            industry: general.Industry,
            marketCap: highlights.MarketCapitalization,
            peRatio: highlights.PERatio,
            revenue: highlights.RevenueTTM,
            profitMargin: highlights.ProfitMargin,
            valuation,
          },
        };
      } catch (err) {
        return eodhdErrorResult(err);
      }
    },
  });
}
