import { type Tool, tool } from 'ai';

import { BRIGHT_DATA_TIMEOUT_MS } from '../constants/search-timeout.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import type { ToolDependencies } from '../types/types.js';

import { mapBrightDataShoppingResult } from './helpers/map-bright-data-shopping-result.helper.js';
import { buildGoogleUrl, engineEnabled } from './bright-data.constants.js';
import { requestBrightData } from './bright-data-client.js';
import { type BrightDataShoppingSearchInput, brightDataShoppingSearchSchema } from './shopping-search.schema.js';
import type { BrightDataShoppingSearchResponse } from './shopping-search.types.js';

export function createBrightDataShoppingSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search for products using Bright Data SERP API (Google Shopping). Returns prices, sellers, images, and ratings. Phrase the query as the bare product name with model number (e.g. "Sony WH-1000XM5") — do NOT add words like "review", "test", or long descriptive sentences.',
    inputSchema: brightDataShoppingSearchSchema,
    execute: async ({ query, count: reqCount, lang }: BrightDataShoppingSearchInput) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'shopping');
      if (!apiKey)
        return {
          results: [],
          error: 'Bright Data shopping search is not enabled',
        };

      deps.logger.log(`Bright Data shopping search for "${query}"`);
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      const url = buildGoogleUrl(query, {
        udm: 28,
        hl: body.hl,
        gl: body.gl,
        num: reqCount ?? cfg.shopping.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as BrightDataShoppingSearchResponse;
        const shopping = data.shopping ?? [];
        if (!shopping.length) {
          deps.logger.warn(`Bright Data shopping returned 0 results for "${query}"`);
          return { results: [] };
        }
        const results = shopping.map(mapBrightDataShoppingResult);
        return { results };
      } catch (err) {
        deps.logger.warn(`Bright Data shopping search failed for "${query}": ${String(err)}`);
        return { results: [] };
      }
    },
  });
}
