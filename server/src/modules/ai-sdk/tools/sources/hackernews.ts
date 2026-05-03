import { tool } from 'ai';
import { z } from 'zod';

import { fetchJson } from './fetch-json.js';
import type { ToolDependencies } from './types.js';

type HNItem = {
  id: number;
  title?: string;
  url?: string;
  score?: number;
  by?: string;
  time?: number;
  descendants?: number;
  type?: string;
  text?: string;
};

type HNUser = {
  id: string;
  karma: number;
  created: number;
  about?: string;
};

export function createHackerNewsSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search Hacker News stories, comments, and jobs using Algolia. Returns titles, URLs, points, and authors.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      tags: z
        .string()
        .optional()
        .describe(
          'Filter by tags: story, comment, job, poll, show_hn, ask_hn, front_page',
        ),
      hitsPerPage: z.number().optional().default(20).describe('Results count'),
    }),
    execute: async ({
      query,
      tags,
      hitsPerPage,
    }: {
      query: string;
      tags?: string;
      hitsPerPage?: number;
    }) => {
      deps.logger.log(`HN Algolia search for "${query}"`);
      const params = new URLSearchParams({
        query,
        hitsPerPage: String(hitsPerPage ?? 20),
      });
      if (tags) params.set('tags', tags);
      const { ok, data } = await fetchJson<{
        hits?: Array<{
          title?: string;
          url?: string;
          objectID?: string;
          points?: number;
          author?: string;
          created_at?: string;
          num_comments?: number;
        }>;
      }>(`https://hn.algolia.com/api/v1/search?${params}`);
      if (!ok || !data?.hits?.length) {
        deps.logger.warn(`HN Algolia returned 0 results for "${query}"`);
        return { results: [] };
      }
      const results = data.hits.map((r) => ({
        title: r.title || '',
        url: r.url || `https://news.ycombinator.com/item?id=${r.objectID}`,
        hnId: r.objectID || '',
        points: r.points ?? 0,
        author: r.author || '',
        createdAt: r.created_at || '',
        numComments: r.num_comments ?? 0,
      }));
      deps.logger.log(
        `HN Algolia returned ${results.length} results for "${query}"`,
      );
      return { results };
    },
  });
}

export function createHackerNewsGetItem(deps: ToolDependencies) {
  return tool({
    description:
      'Get a specific Hacker News item (story or comment) by its ID using the Firebase API. Returns the full item data.',
    inputSchema: z.object({
      id: z.number().describe('The Hacker News item ID'),
    }),
    execute: async ({ id }: { id: number }) => {
      deps.logger.log(`HN Firebase get item ${id}`);
      const { ok, data } = await fetchJson<HNItem>(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );
      if (!ok || !data) {
        deps.logger.warn(`HN Firebase item ${id} not found`);
        return { error: 'Item not found' };
      }
      return {
        id: data.id,
        title: data.title || '',
        url: data.url || '',
        text: data.text || '',
        score: data.score ?? 0,
        by: data.by || '',
        time: data.time ?? 0,
        descendants: data.descendants ?? 0,
        type: data.type || '',
      };
    },
  });
}

export function createHackerNewsGetUser(deps: ToolDependencies) {
  return tool({
    description:
      'Get a Hacker News user profile by username using the Firebase API. Returns karma, creation date, and about text.',
    inputSchema: z.object({
      username: z.string().describe('The Hacker News username'),
    }),
    execute: async ({ username }: { username: string }) => {
      deps.logger.log(`HN Firebase get user "${username}"`);
      const { ok, data } = await fetchJson<HNUser>(
        `https://hacker-news.firebaseio.com/v0/user/${username}.json`,
      );
      if (!ok || !data) {
        deps.logger.warn(`HN Firebase user "${username}" not found`);
        return { error: 'User not found' };
      }
      return {
        id: data.id,
        karma: data.karma ?? 0,
        created: data.created ?? 0,
        about: data.about || '',
      };
    },
  });
}
