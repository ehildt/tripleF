import { tool } from 'ai';

import { applyLocaleParams } from '../apply-locale-params.helper.js';
import { applyRecencyParam } from '../apply-recency-param.helper.js';
import { fetchWithTimeout } from '../fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from '../search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../standalone-query.constants.js';
import type { ToolDependencies } from '../types.js';

import {
  type SerperNewsSearchInput,
  serperNewsSearchSchema,
} from './news-search.schema.js';
import type { SerperNewsSearchResponse } from './news-search.types.js';
import { HEADERS } from './serper.constants.js';

export function createSerperNewsSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the latest news using Serper.dev. Returns headlines, sources, dates, and snippets. Pass recency ("day"|"week"|"month"|"year") to restrict to a recent period. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: serperNewsSearchSchema,
    execute: async ({
      query,
      count: reqCount,
      recency,
      lang,
    }: SerperNewsSearchInput) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.news.enabled) {
        return { results: [], error: 'Serper.dev news is not enabled' };
      }

      deps.logger.log(`Serper.dev News search for "${query}"`);
      const num = Math.min(reqCount ?? cfg.news.results, cfg.news.results);
      const newsBody: Record<string, unknown> = {
        q: query,
        num,
      };
      applyLocaleParams(newsBody, lang ?? deps.defaultLang);
      applyRecencyParam(newsBody, recency);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/news',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify(newsBody),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [] };
      const data = (await res.json()) as SerperNewsSearchResponse;
      if (!data.news?.length) return { results: [] };
      const results = data.news.map((r) => ({
        title: r.title,
        snippet: r.snippet || '',
        url: r.link,
        source: r.source || '',
        date: r.date || '',
        imageUrl: r.imageUrl || '',
      }));
      return { results };
    },
  });
}
