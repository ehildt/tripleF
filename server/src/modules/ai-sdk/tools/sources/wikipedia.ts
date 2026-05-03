import { tool } from 'ai';
import { z } from 'zod';

import { fetchJson } from './fetch-json.js';
import type { ToolDependencies } from './types.js';

export function createWikipediaSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search Wikipedia for articles matching the query. Returns titles, descriptions, and page links.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      lang: z
        .string()
        .optional()
        .default('en')
        .describe('Language code (e.g. en, fr, es)'),
    }),
    execute: async ({ query, lang }: { query: string; lang?: string }) => {
      deps.logger.log(`Wikipedia search for "${query}"`);
      const { ok, data } = await fetchJson<{
        query?: {
          search?: Array<{ title: string; snippet: string; pageid: number }>;
        };
      }>(
        `https://${lang || 'en'}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=10`,
      );
      if (!ok || !data?.query?.search?.length) {
        deps.logger.warn(`Wikipedia returned 0 results for "${query}"`);
        return { results: [] };
      }
      const results = data.query.search.map((r) => ({
        title: r.title,
        snippet: r.snippet.replace(/<[^>]*>/g, '').slice(0, 300),
        pageId: r.pageid,
        url: `https://${lang || 'en'}.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`,
      }));
      deps.logger.log(
        `Wikipedia returned ${results.length} results for "${query}"`,
      );
      return { results };
    },
  });
}

export function createWikipediaGetPage(deps: ToolDependencies) {
  return tool({
    description:
      'Get the full text content of a Wikipedia page by title. Returns the page title and its text content.',
    inputSchema: z.object({
      title: z.string().describe('The exact page title'),
      lang: z.string().optional().default('en').describe('Language code'),
    }),
    execute: async ({ title, lang }: { title: string; lang?: string }) => {
      deps.logger.log(`Wikipedia get page "${title}"`);
      const { ok, data } = await fetchJson<{
        query?: {
          pages?: Record<string, { extract?: string; title?: string }>;
        };
      }>(
        `https://${lang || 'en'}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=true&format=json`,
      );
      if (!ok || !data?.query?.pages) {
        return { content: '', title: '', error: 'Page not found' };
      }
      const pages = data.query.pages;
      const page = Object.values(pages)[0];
      if (!page || !page.extract) {
        return { content: '', title: '', error: 'Page not found' };
      }
      return {
        title: page.title || title,
        content: page.extract.slice(0, 10000),
      };
    },
  });
}
