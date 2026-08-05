import { tool } from 'ai';
import { z } from 'zod';

import { applyLocaleParams } from '../apply-locale-params.helper.js';
import {
  applyRecencyParam,
  type SearchRecency,
} from '../apply-recency-param.helper.js';
import { fetchWithTimeout } from '../fetch-with-timeout.js';
import { RECENCY_DESCRIPTION } from '../recency.constants.js';
import { SEARCH_TIMEOUT_MS } from '../search-timeout.js';
import {
  STANDALONE_QUERY_DESCRIPTION,
  STANDALONE_QUERY_TOOL_CLAUSE,
} from '../standalone-query.constants.js';
import type { ToolDependencies } from '../types.js';

import { HEADERS } from './serper.constants.js';

export function createSerperWebSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the web using Serper.dev (Google results). Returns organic results with titles, snippets, and links. Pass recency ("day"|"week"|"month"|"year") to restrict to fresh results. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: z.object({
      query: z.string().describe(STANDALONE_QUERY_DESCRIPTION),
      recency: z
        .enum(['day', 'week', 'month', 'year'])
        .optional()
        .describe(RECENCY_DESCRIPTION),
      lang: z
        .string()
        .optional()
        .describe(
          'Two-letter ISO language code for result preference (e.g. en, de, ja)',
        ),
    }),
    execute: async ({
      query,
      recency,
      lang,
    }: {
      query: string;
      recency?: SearchRecency;
      lang?: string;
    }) => {
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
      const data = (await res.json()) as {
        organic?: Array<{ title: string; link: string; snippet: string }>;
      };
      if (!data.organic?.length) {
        deps.logger.warn(`Serper.dev returned 0 results for "${query}"`);
        return { results: [] };
      }
      const results = data.organic.map((r) => ({
        title: r.title,
        snippet: (r.snippet || '').slice(0, 300),
        url: r.link,
        source: 'serper',
      }));
      deps.logger.log(
        `Serper.dev returned ${results.length} results for "${query}"`,
      );
      return { results };
    },
  });
}
