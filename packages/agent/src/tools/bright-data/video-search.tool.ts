import { type Tool, tool } from 'ai';

import { EMBEDDABLE_VIDEO_PROVIDER_CLAUSE } from '../../schemas/constants/embeddable-video-providers.constant.js';
import { BRIGHT_DATA_TIMEOUT_MS } from '../constants/search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../constants/standalone-query.constants.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { applyRecencyParam } from '../helpers/apply-recency-param.helper.js';
import { localizedQuerySuffix } from '../helpers/localized-query-suffix.helper.js';
import type { ToolDependencies } from '../types/types.js';

import { mapBrightDataVideoResult } from './helpers/map-bright-data-video-result.helper.js';
import { buildGoogleUrl, engineEnabled } from './bright-data.constants.js';
import { requestBrightData } from './bright-data-client.js';
import { type BrightDataVideoSearchInput, brightDataVideoSearchSchema } from './video-search.schema.js';
import type { BrightDataVideoSearchResponse } from './video-search.types.js';

export function createBrightDataVideoSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      `Search for videos using Bright Data SERP API (Google Videos). Returns titles, links, snippets, and duration. ${EMBEDDABLE_VIDEO_PROVIDER_CLAUSE} Pass recency ("day"|"week"|"month"|"year") to restrict to recently uploaded videos. ` +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: brightDataVideoSearchSchema,
    execute: async ({ query, count: reqCount, recency, lang }: BrightDataVideoSearchInput) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'videos');
      if (!apiKey)
        return {
          results: [],
          error: 'Bright Data video search is not enabled',
        };

      const langSuffix = localizedQuerySuffix(lang ?? deps.defaultLang);
      const searchQuery =
        langSuffix && !query.toLowerCase().includes(langSuffix.toLowerCase()) ? `${query} ${langSuffix}` : query;

      deps.logger.log(`Bright Data video search for "${searchQuery}"`);
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      applyRecencyParam(body, recency);
      const url = buildGoogleUrl(searchQuery, {
        udm: 7,
        hl: body.hl,
        gl: body.gl,
        tbs: body.tbs,
        num: reqCount ?? cfg.videos.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as BrightDataVideoSearchResponse;
        // Bright Data returns Google Videos results under `organic` (each with
        // a duration field), not a dedicated `videos` array.
        const videos = data.organic ?? [];
        if (!videos.length) return { results: [] };
        const results = videos.map(mapBrightDataVideoResult);
        deps.logger.log(`Bright Data video search returned ${results.length} results for "${searchQuery}"`);
        return { results };
      } catch (err) {
        deps.logger.warn(`Bright Data video search failed for "${searchQuery}": ${String(err)}`);
        return { results: [] };
      }
    },
  });
}
