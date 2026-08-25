import { type Tool, tool } from 'ai';

import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../constants/standalone-query.constants.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { applyRecencyParam } from '../helpers/apply-recency-param.helper.js';
import { fetchWithTimeout } from '../helpers/fetch-with-timeout.js';
import type { ToolDependencies } from '../types/types.js';

import { HEADERS } from './serper.constants.js';
import { type SerperWebSearchInput, serperWebSearchSchema } from './web-search.schema.js';
import type { SerperWebSearchResponse } from './web-search.types.js';

export function createSerperWebSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search the web using Serper.dev (Google results). Returns organic results with titles, snippets, and links. Pass recency ("day"|"week"|"month"|"year") to restrict to fresh results. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: serperWebSearchSchema,
    execute: async ({ query, recency, lang }: SerperWebSearchInput) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.web.enabled) {
        return { results: [], error: 'Serper.dev web search is not enabled' };
      }

      deps.logger.log(`Serper.dev search for "${query}"`);
      const body: Record<string, unknown> = {
        q: query,
        num: cfg.web.results,
      };
      applyLocaleParams(body, lang ?? deps.defaultLang);
      applyRecencyParam(body, recency);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/search',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify(body),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) {
        deps.logger.warn(`Serper.dev returned ${res.status} for "${query}"`);
        return { results: [] };
      }
      const data = (await res.json()) as SerperWebSearchResponse;
      if (!data.organic?.length) {
        deps.logger.warn(`Serper.dev returned 0 results for "${query}"`);
        return { results: [] };
      }
      const results = data.organic.map((r) => ({
        title: r.title,
        snippet: r.snippet || '',
        url: r.link,
        source: 'serper',
      }));
      deps.logger.log(`Serper.dev returned ${results.length} results for "${query}"`);
      return { results };
    },
  });
}
