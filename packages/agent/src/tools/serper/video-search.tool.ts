import { type Tool, tool } from 'ai';

import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../constants/standalone-query.constants.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { applyRecencyParam } from '../helpers/apply-recency-param.helper.js';
import { buildYoutubeThumbnailUrl } from '../helpers/build-youtube-thumbnail-url.helper.js';
import { fetchWithTimeout } from '../helpers/fetch-with-timeout.js';
import { localizedQuerySuffix } from '../helpers/localized-query-suffix.helper.js';
import { repairVideoLink } from '../helpers/repair-video-link.helper.js';
import type { ToolDependencies } from '../types/types.js';

import { HEADERS } from './serper.constants.js';
import { type SerperVideoSearchInput, serperVideoSearchSchema } from './video-search.schema.js';
import type { SerperVideoSearchResponse } from './video-search.types.js';

export function createSerperVideoSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search for videos using Serper.dev. Returns titles, links, channel names, duration, and publish dates. Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms. Pass recency ("day"|"week"|"month"|"year") to restrict to recently uploaded videos. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: serperVideoSearchSchema,
    execute: async ({ query, count: reqCount, recency, lang }: SerperVideoSearchInput) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.videos.enabled) {
        return { results: [], error: 'Serper.dev videos is not enabled' };
      }

      const langSuffix = localizedQuerySuffix(lang ?? deps.defaultLang);
      const searchQuery =
        langSuffix && !query.toLowerCase().includes(langSuffix.toLowerCase()) ? `${query} ${langSuffix}` : query;

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
      const data = (await res.json()) as SerperVideoSearchResponse;
      if (!data.videos?.length) return { results: [] };
      // Repair each link before it reaches the model: Serper occasionally
      // glues result markup onto the link ("…watch?v=ID:J<b>Title</b>B\uFFFD").
      // Unrepairable links are dropped — a poisoned URL would break the
      // embed, the poster, and the server-side media pool.
      const results = data.videos
        .flatMap((r) => {
          const link = repairVideoLink(r.link);
          return link ? [{ r, link }] : [];
        })
        .slice(0, num)
        .map(({ r, link }) => ({
          title: r.title,
          link,
          // Keep the provider's original link when it had to be repaired —
          // auditability for provider-side payload corruption.
          ...(link !== r.link ? { originalLink: r.link } : {}),
          snippet: r.snippet || '',
          channel: r.channel || '',
          duration: r.duration || '',
          date: r.date || '',
          // Serper thumbnails are Google proxy images (blocked by our image
          // trust rules) — derive a direct thumbnail for YouTube instead.
          // maxresdefault is not guaranteed to exist; consumers degrade to
          // hqdefault/mqdefault on failure.
          thumbnailUrl: buildYoutubeThumbnailUrl(link) ?? '',
          source: r.source || '',
          views: r.views ?? 0,
        }));
      deps.logger.log(`Serper.dev Video search returned ${results.length} results for "${searchQuery}"`);
      return { results };
    },
  });
}
