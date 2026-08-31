import { type Tool, tool } from 'ai';

import { BRIGHT_DATA_TIMEOUT_MS } from '../constants/search-timeout.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import type { ToolDependencies } from '../types/types.js';

import { mapBrightDataPlaceResult } from './helpers/map-bright-data-place-result.helper.js';
import { buildGoogleUrl, engineEnabled } from './bright-data.constants.js';
import { requestBrightData } from './bright-data-client.js';
import { type BrightDataPlacesSearchInput, brightDataPlacesSearchSchema } from './places-search.schema.js';
import type { BrightDataPlacesSearchResponse } from './places-search.types.js';

export function createBrightDataPlacesSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search for places and businesses using Bright Data SERP API (Google Maps local results). Returns names, addresses, ratings, review counts, and coordinates. Phrase the query like a Google Maps search: a business name, a business type, or a business type plus location (e.g. "MediaMarkt Berlin", "coffee shops in Munich").',
    inputSchema: brightDataPlacesSearchSchema,
    execute: async ({ query, count: reqCount, lang }: BrightDataPlacesSearchInput) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'places');
      if (!apiKey)
        return {
          results: [],
          error: 'Bright Data places search is not enabled',
        };

      deps.logger.log(`Bright Data places search for "${query}"`);
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      const url = buildGoogleUrl(query, {
        tbm: 'lcl',
        hl: body.hl,
        gl: body.gl,
        num: reqCount ?? cfg.places.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as BrightDataPlacesSearchResponse;
        const places = data.local_results ?? data.places ?? [];
        if (!places.length) {
          deps.logger.warn(`Bright Data places returned 0 results for "${query}"`);
          return { results: [] };
        }
        const results = places.map(mapBrightDataPlaceResult);
        return { results };
      } catch (err) {
        deps.logger.warn(`Bright Data places search failed for "${query}": ${String(err)}`);
        return { results: [] };
      }
    },
  });
}
