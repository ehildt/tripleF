import type { ToolDependencies } from '@triplef/agent/tools';
import { tool } from 'ai';

import { createEodhdClient, eodhdErrorResult } from './eodhd-tool.helper.js';
import { eodhdSearchSchema } from './search.schema.js';

export function createEodhdSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Resolve a company, ETF, or index name to EODHD ticker codes (e.g. "Nvidia" → NVDA.US, "MSCI World" → URTH.US). Use this before fetching quotes, history, technicals, or news for a named entity so you pass the correct ticker.',
    inputSchema: eodhdSearchSchema,
    execute: async ({ query, limit }) => {
      const client = createEodhdClient(deps, 'search');
      if (!client) {
        return {
          results: [],
          error: 'EODHD search is not enabled or no API key configured',
        };
      }
      try {
        const results = await client.search(query, limit ?? 10);
        return { results };
      } catch (err) {
        return eodhdErrorResult(err);
      }
    },
  });
}
