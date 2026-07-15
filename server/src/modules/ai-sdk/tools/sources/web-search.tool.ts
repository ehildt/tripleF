import { tool } from 'ai';
import { z } from 'zod';

import { dedupeByUrl } from './dedupe-by-url.js';
import { searchSerper } from './search-serper.js';
import type { ResultItem } from './sort-by-priority.js';
import { sortByPriority } from './sort-by-priority.js';
import type { ToolDependencies } from './types.js';

const DESCRIPTION = 'Search the web and return titles, snippets, and URLs.';

const INPUT_SCHEMA = z.object({
  query: z.string().describe('The search query'),
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

    execute: async ({ query, lang }: { query: string; lang?: string }) => {
      const cfg = deps.getLiveConfig();
      const allResults: ResultItem[] = [];

      await searchSerper(query, cfg, deps, allResults, lang);

      const sorted = sortByPriority(dedupeByUrl(allResults));

      deps.logger.log(
        `Web search: ${allResults.length} raw → ${sorted.length} unique for "${query}"`,
      );

      return { results: sorted };
    },
  });
}
