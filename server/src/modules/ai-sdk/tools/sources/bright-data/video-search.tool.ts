import { tool } from 'ai';
import { z } from 'zod';

import { localizedQuerySuffix } from '../../../../harness/helpers/localized-query-suffix.helper.js';
import { applyLocaleParams } from '../apply-locale-params.helper.js';
import {
  applyRecencyParam,
  type SearchRecency,
} from '../apply-recency-param.helper.js';
import { requestBrightData } from '../bright-data-client.js';
import { buildYoutubeThumbnailUrl } from '../build-youtube-thumbnail-url.helper.js';
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

export function createBrightDataVideoSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for videos using Bright Data SERP API (Google Videos). Returns titles, links, snippets, and duration. Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms. Pass recency ("day"|"week"|"month"|"year") to restrict to recently uploaded videos. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          `${STANDALONE_QUERY_DESCRIPTION} Add the video type (e.g. review, trailer, tutorial, gameplay).`,
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
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'videos');
      if (!apiKey)
        return {
          results: [],
          error: 'Bright Data video search is not enabled',
        };

      const langSuffix = localizedQuerySuffix(lang ?? deps.defaultLang);
      const searchQuery =
        langSuffix && !query.toLowerCase().includes(langSuffix.toLowerCase())
          ? `${query} ${langSuffix}`
          : query;

      deps.logger.log(`Bright Data video search for "${searchQuery}"`);
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      applyRecencyParam(body, recency);
      const url = buildGoogleUrl(searchQuery, {
        udm: 7,
        hl: body.hl,
        gl: body.gl,
        tbs: body.tbs,
        num: reqCount ?? cfg.videos.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as {
          organic?: Array<{
            title?: string;
            link?: string;
            description?: string;
            duration?: string;
            image?: string;
          }>;
        };
        // Bright Data returns Google Videos results under `organic` (each with
        // a duration field), not a dedicated `videos` array.
        const videos = data.organic ?? [];
        if (!videos.length) return { results: [] };
        const results = videos.map((r) => ({
          title: r.title || '',
          link: r.link || '',
          snippet: r.description || '',
          channel: '',
          duration: r.duration || '',
          date: '',
          // `image` is an embedded base64 thumbnail — derive a direct YouTube
          // thumbnail from the link instead.
          thumbnailUrl: buildYoutubeThumbnailUrl(r.link || '') ?? '',
          source: SOURCE,
          views: 0,
        }));
        deps.logger.log(
          `Bright Data video search returned ${results.length} results for "${searchQuery}"`,
        );
        return { results };
      } catch (err) {
        deps.logger.warn(
          `Bright Data video search failed for "${searchQuery}": ${String(err)}`,
        );
        return { results: [] };
      }
    },
  });
}
