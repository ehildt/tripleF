import { tool } from 'ai';

import { applyLocaleParams } from '../apply-locale-params.helper.js';
import { applyRecencyParam } from '../apply-recency-param.helper.js';
import { requestBrightData } from '../bright-data-client.js';
import { BRIGHT_DATA_TIMEOUT_MS } from '../search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../standalone-query.constants.js';
import type { ToolDependencies } from '../types.js';

import {
  buildGoogleUrl,
  engineEnabled,
  SOURCE,
} from './bright-data.constants.js';
import {
  type BrightDataWebSearchInput,
  brightDataWebSearchSchema,
} from './web-search.schema.js';
import type { BrightDataWebSearchResponse } from './web-search.types.js';

export function createBrightDataWebSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the web using Bright Data SERP API (Google). Returns organic results with titles, snippets, and links. Pass recency ("day"|"week"|"month"|"year") to restrict to fresh results. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: brightDataWebSearchSchema,
    execute: async ({ query, recency, lang }: BrightDataWebSearchInput) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'web');
      if (!apiKey)
        return { results: [], error: 'Bright Data web search is not enabled' };

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
        const results = organic.map((r) => ({
          title: r.title,
          snippet: (r.description || '').slice(0, 300),
          url: r.link,
          source: SOURCE,
        }));
        deps.logger.log(
          `Bright Data returned ${results.length} results for "${query}"`,
        );
        return { results };
      } catch (err) {
        deps.logger.warn(
          `Bright Data web search failed for "${query}": ${String(err)}`,
        );
        return { results: [] };
      }
    },
  });
}
