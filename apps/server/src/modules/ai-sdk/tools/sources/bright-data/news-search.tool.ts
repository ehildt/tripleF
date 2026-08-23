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
  type BrightDataNewsSearchInput,
  brightDataNewsSearchSchema,
} from './news-search.schema.js';
import type { BrightDataNewsSearchResponse } from './news-search.types.js';

export function createBrightDataNewsSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the latest news using Bright Data SERP API. Returns headlines, sources, dates, and snippets. Pass recency ("day"|"week"|"month"|"year") to restrict to a recent period. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: brightDataNewsSearchSchema,
    execute: async ({
      query,
      count: reqCount,
      recency,
      lang,
    }: BrightDataNewsSearchInput) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'news');
      if (!apiKey)
        return { results: [], error: 'Bright Data news search is not enabled' };

      deps.logger.log(`Bright Data news search for "${query}"`);
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      applyRecencyParam(body, recency);
      const url = buildGoogleUrl(query, {
        tbm: 'nws',
        hl: body.hl,
        gl: body.gl,
        tbs: body.tbs,
        num: reqCount ?? cfg.news.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as BrightDataNewsSearchResponse;
        const news = data.news ?? [];
        if (!news.length) return { results: [] };
        const results = news.map((r) => ({
          title: r.title,
          snippet: (r.description || '').slice(0, 300),
          url: r.link,
          source: r.source || SOURCE,
          date: r.date || '',
          imageUrl: r.image_url || '',
        }));
        deps.logger.log(
          `Bright Data news returned ${results.length} results for "${query}"`,
        );
        return { results };
      } catch (err) {
        deps.logger.warn(
          `Bright Data news search failed for "${query}": ${String(err)}`,
        );
        return { results: [] };
      }
    },
  });
}
