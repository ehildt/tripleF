import { tool } from 'ai';
import { z } from 'zod';

import { applyLocaleParams } from '../apply-locale-params.helper.js';
import {
  applyRecencyParam,
  type SearchRecency,
} from '../apply-recency-param.helper.js';
import { requestBrightData } from '../bright-data-client.js';
import { RECENCY_DESCRIPTION } from '../recency.constants.js';
import { BRIGHT_DATA_TIMEOUT_MS } from '../search-timeout.js';
import {
  STANDALONE_QUERY_DESCRIPTION,
  STANDALONE_QUERY_TOOL_CLAUSE,
} from '../standalone-query.constants.js';
import type { ToolDependencies } from '../types.js';

import {
  buildGoogleUrl,
  engineEnabled,
  SOURCE,
} from './bright-data.constants.js';

export function createBrightDataWebSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the web using Bright Data SERP API (Google). Returns organic results with titles, snippets, and links. Pass recency ("day"|"week"|"month"|"year") to restrict to fresh results. ' +
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
        })) as {
          organic?: Array<{ title: string; link: string; description: string }>;
        };
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
