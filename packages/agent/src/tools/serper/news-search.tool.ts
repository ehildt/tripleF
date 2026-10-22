import { type Tool, tool } from 'ai';

import { SEARCH_API_RESULTS_CAP } from '../constants/search-results-cap.constant.js';
import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.constant.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../constants/standalone-query.constant.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { applyRecencyParam } from '../helpers/apply-recency-param.helper.js';
import { fetchWithTimeout } from '../helpers/fetch-with-timeout.helper.js';
import { isGoogleGotoLink } from '../helpers/is-google-goto-link.helper.js';
import type { ToolDependencies } from '../types/tool-dependencies.types.js';

import { mapSerperNewsResult } from './helpers/map-serper-news-result.helper.js';
import { type SerperNewsSearchInput, serperNewsSearchSchema } from './news-search.schema.js';
import type { SerperNewsSearchResponse } from './news-search.types.js';
import { HEADERS } from './serper.constant.js';

export function createSerperNewsSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search the latest news using Serper.dev. Returns headlines, sources, dates, and snippets — at most the top 3 per call, so cover each distinct topic with its own call. Pass recency ("day"|"week"|"month"|"year") to restrict to a recent period. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: serperNewsSearchSchema,
    execute: async ({ query, count: reqCount, recency, lang }: SerperNewsSearchInput) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.news.enabled) {
        return { results: [], error: 'Serper.dev news is not enabled' };
      }

      deps.logger.log(`Serper.dev News search for "${query}"`);
      const num = Math.min(reqCount ?? cfg.news.results, cfg.news.results, SEARCH_API_RESULTS_CAP);
      if (num < (reqCount ?? cfg.news.results)) {
        deps.logger.warn(
          `Serper.dev news results clamped to ${SEARCH_API_RESULTS_CAP} (top-3 rank cutoff) for "${query}"`,
        );
      }
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
      const mapped = data.news.map(mapSerperNewsResult);
      // Same google.com/goto wrapper defense as web search — unresolved
      // wrapper links must never reach citations or page fetching.
      const results = mapped.filter((r) => !isGoogleGotoLink(r.url));
      if (results.length < mapped.length) {
        deps.logger.warn(
          `Serper.dev dropped ${mapped.length - results.length} unresolved google.com/goto link(s) for "${query}"`,
        );
      }
      return { results };
    },
  });
}
