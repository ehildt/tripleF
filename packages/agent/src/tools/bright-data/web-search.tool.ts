import { type Tool, tool } from 'ai';

import { BRIGHT_DATA_TIMEOUT_MS } from '../constants/search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../constants/standalone-query.constants.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { applyRecencyParam } from '../helpers/apply-recency-param.helper.js';
import type { ToolDependencies } from '../types/types.js';

import { mapBrightDataWebResult } from './helpers/map-bright-data-web-result.helper.js';
import { buildGoogleUrl, engineEnabled } from './bright-data.constants.js';
import { requestBrightData } from './bright-data-client.js';
import { type BrightDataWebSearchInput, brightDataWebSearchSchema } from './web-search.schema.js';
import type { BrightDataWebSearchResponse } from './web-search.types.js';

export function createBrightDataWebSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search the web using Bright Data SERP API (Google). Returns organic results with titles, snippets, and links. Pass recency ("day"|"week"|"month"|"year") to restrict to fresh results. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: brightDataWebSearchSchema,
    execute: async ({ query, recency, lang }: BrightDataWebSearchInput) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'web');
      if (!apiKey) return { results: [], error: 'Bright Data web search is not enabled' };

      deps.logger.log(`Bright Data web search for "${query}"`);
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      applyRecencyParam(body, recency);
      const url = buildGoogleUrl(query, {
        hl: body.hl,
        gl: body.gl,
        tbs: body.tbs,
        num: cfg.web.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as BrightDataWebSearchResponse;
        const organic = data.organic ?? [];
        if (!organic.length) {
          deps.logger.warn(`Bright Data returned 0 results for "${query}"`);
          return { results: [] };
        }
        const results = organic.map(mapBrightDataWebResult);
        deps.logger.log(`Bright Data returned ${results.length} results for "${query}"`);
        return { results };
      } catch (err) {
        deps.logger.warn(`Bright Data web search failed for "${query}": ${String(err)}`);
        return { results: [] };
      }
    },
  });
}
