import { type Tool, tool } from 'ai';

import { BRIGHT_DATA_TIMEOUT_MS } from '../constants/search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../constants/standalone-query.constants.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { applyRecencyParam } from '../helpers/apply-recency-param.helper.js';
import { buildYoutubeThumbnailUrl } from '../helpers/build-youtube-thumbnail-url.helper.js';
import { localizedQuerySuffix } from '../helpers/localized-query-suffix.helper.js';
import type { ToolDependencies } from '../types/types.js';

import { buildGoogleUrl, engineEnabled, SOURCE } from './bright-data.constants.js';
import { requestBrightData } from './bright-data-client.js';
import { type BrightDataVideoSearchInput, brightDataVideoSearchSchema } from './video-search.schema.js';
import type { BrightDataVideoSearchResponse } from './video-search.types.js';

export function createBrightDataVideoSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search for videos using Bright Data SERP API (Google Videos). Returns titles, links, snippets, and duration. Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms. Pass recency ("day"|"week"|"month"|"year") to restrict to recently uploaded videos. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: brightDataVideoSearchSchema,
    execute: async ({ query, count: reqCount, recency, lang }: BrightDataVideoSearchInput) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'videos');
      if (!apiKey)
        return {
          results: [],
          error: 'Bright Data video search is not enabled',
        };

      const langSuffix = localizedQuerySuffix(lang ?? deps.defaultLang);
      const searchQuery =
        langSuffix && !query.toLowerCase().includes(langSuffix.toLowerCase()) ? `${query} ${langSuffix}` : query;

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
        })) as BrightDataVideoSearchResponse;
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
        deps.logger.log(`Bright Data video search returned ${results.length} results for "${searchQuery}"`);
        return { results };
      } catch (err) {
        deps.logger.warn(`Bright Data video search failed for "${searchQuery}": ${String(err)}`);
        return { results: [] };
      }
    },
  });
}
