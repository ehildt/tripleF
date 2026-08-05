import { tool } from 'ai';
import { z } from 'zod';

import { localizedQuerySuffix } from '../../../../harness/helpers/localized-query-suffix.helper.js';
import { applyLocaleParams } from '../apply-locale-params.helper.js';
import {
  applyRecencyParam,
  type SearchRecency,
} from '../apply-recency-param.helper.js';
import { buildYoutubeThumbnailUrl } from '../build-youtube-thumbnail-url.helper.js';
import { fetchWithTimeout } from '../fetch-with-timeout.js';
import { RECENCY_DESCRIPTION } from '../recency.constants.js';
import { SEARCH_TIMEOUT_MS } from '../search-timeout.js';
import {
  STANDALONE_QUERY_DESCRIPTION,
  STANDALONE_QUERY_TOOL_CLAUSE,
} from '../standalone-query.constants.js';
import type { ToolDependencies } from '../types.js';

import { HEADERS } from './serper.constants.js';

export function createSerperVideoSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for videos using Serper.dev. Returns titles, links, channel names, duration, and publish dates. Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms. Pass recency ("day"|"week"|"month"|"year") to restrict to recently uploaded videos. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          `${STANDALONE_QUERY_DESCRIPTION} Add the video type (e.g. review, trailer, tutorial, gameplay). When the conversation language is not English, phrase the descriptive words in that language and append the language's own name (e.g. "Review Deutsch") to pull localized results.`,
        ),
      count: z.number().optional().describe('Number of results (max 100)'),
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
      count: reqCount,
      recency,
      lang,
    }: {
      query: string;
      count?: number;
      recency?: SearchRecency;
      lang?: string;
    }) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.videos.enabled) {
        return { results: [], error: 'Serper.dev videos is not enabled' };
      }

      const langSuffix = localizedQuerySuffix(lang ?? deps.defaultLang);
      const searchQuery =
        langSuffix && !query.toLowerCase().includes(langSuffix.toLowerCase())
          ? `${query} ${langSuffix}`
          : query;

      deps.logger.log(`Serper.dev Video search for "${searchQuery}"`);
      const num = Math.min(reqCount ?? cfg.videos.results, cfg.videos.results);
      const videoBody: Record<string, unknown> = {
        q: searchQuery,
        num,
      };
      applyLocaleParams(videoBody, lang ?? deps.defaultLang);
      applyRecencyParam(videoBody, recency);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/videos',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify(videoBody),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [] };
      const data = (await res.json()) as {
        videos?: Array<{
          title: string;
          link: string;
          snippet: string;
          channel: string;
          duration: string;
          date: string;
          imageUrl: string;
          source?: string;
          views: number;
        }>;
      };
      if (!data.videos?.length) return { results: [] };
      const results = data.videos.slice(0, num).map((r) => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet || '',
        channel: r.channel || '',
        duration: r.duration || '',
        date: r.date || '',
        // Serper thumbnails are Google proxy images (blocked by our image
        // trust rules) — derive a direct thumbnail for YouTube instead.
        thumbnailUrl: buildYoutubeThumbnailUrl(r.link) ?? '',
        source: r.source || '',
        views: r.views ?? 0,
      }));
      deps.logger.log(
        `Serper.dev Video search returned ${results.length} results for "${searchQuery}"`,
      );
      return { results };
    },
  });
}
