import { tool } from 'ai';
import { z } from 'zod';

import type { SearchRecency } from './apply-recency-param.helper.js';
import { dedupeByUrl } from './dedupe-by-url.js';
import { searchSerper } from './search-serper.js';
import type { ResultItem } from './sort-by-priority.js';
import { sortByPriority } from './sort-by-priority.js';
import type { ToolDependencies } from './types.js';

const DESCRIPTION =
  'Search the web and return titles, snippets, and URLs. Pass recency ("day"|"week"|"month"|"year") to restrict to fresh results.';

const INPUT_SCHEMA = z.object({
  query: z.string().describe('The search query'),
  recency: z
    .enum(['day', 'week', 'month', 'year'])
    .optional()
    .describe(
      'Restrict results to the given past period. Use for fresh content; leave unset for evergreen, historical, or general queries.',
    ),
  lang: z
    .string()
    .optional()
    .describe(
      'Two-letter ISO language code for result preference (e.g. en, de, ja)',
    ),
});

export function createWebSearch(deps: ToolDependencies) {
  return tool({
    inputSchema: INPUT_SCHEMA,
    description: DESCRIPTION,

    execute: async ({
      query,
      recency,
      lang,
    }: {
      query: string;
      recency?: SearchRecency;
      lang?: string;
    }) => {
      const cfg = deps.getLiveConfig();
      const allResults: ResultItem[] = [];

      await searchSerper(query, cfg, deps, allResults, lang, recency);

      const sorted = sortByPriority(dedupeByUrl(allResults));

      deps.logger.log(
        `Web search: ${allResults.length} raw → ${sorted.length} unique for "${query}"`,
      );

      return { results: sorted };
    },
  });
}
