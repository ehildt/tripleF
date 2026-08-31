import { type Tool, tool } from 'ai';

import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../constants/standalone-query.constants.js';
import type { SearchRecency } from '../helpers/apply-recency-param.helper.js';
import { fetchWithTimeout } from '../helpers/fetch-with-timeout.js';
import type { ToolDependencies } from '../types/types.js';

import { mapYoutubeVideoResult } from './helpers/map-youtube-video-result.helper.js';
import { type YoutubeVideoSearchInput, youtubeVideoSearchSchema } from './youtube.schema.js';
import type { VideoStats, YoutubeSearchResponse, YoutubeVideosResponse } from './youtube.types.js';

const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

const RECENCY_DAYS: Record<NonNullable<SearchRecency>, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};

/** YouTube filters by upload date (RFC 3339) instead of a quick-range token. */
function publishedAfterFor(recency?: SearchRecency): string | undefined {
  if (!recency) return undefined;
  return new Date(Date.now() - RECENCY_DAYS[recency] * 86_400_000).toISOString();
}

/**
 * Extract the machine-readable reason ("quotaExceeded", "rateLimitExceeded",
 * …) from a YouTube error envelope so failed calls are visible in the logs
 * instead of silently degrading to empty result sets.
 */
async function readErrorReason(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as {
      error?: { errors?: { reason?: string }[] };
    };
    return body.error?.errors?.[0]?.reason;
  } catch {
    return undefined;
  }
}

/**
 * One batched videos.list call (1 quota unit) enriching search results with
 * view counts, ISO 8601 durations, and the video's declared language —
 * search.list returns none of them.
 */
async function fetchYoutubeVideoStats(
  videoIds: string[],
  apiKey: string,
  logger: ToolDependencies['logger'],
): Promise<Map<string, VideoStats>> {
  const params = new URLSearchParams({
    part: 'statistics,contentDetails,snippet',
    id: videoIds.join(','),
    key: apiKey,
  });
  const res = await fetchWithTimeout(`${VIDEOS_URL}?${params}`, {}, { timeoutMs: SEARCH_TIMEOUT_MS }).catch(
    (err: unknown) => {
      logger.warn(`YouTube stats fetch failed: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`);
      throw err;
    },
  );
  const map = new Map<string, VideoStats>();
  if (!res.ok) {
    const reason = await readErrorReason(res);
    logger.warn(`YouTube stats fetch failed — HTTP ${res.status}${reason ? ` (${reason})` : ''}`);
    return map;
  }
  const data = (await res.json()) as YoutubeVideosResponse;
  for (const item of data.items ?? []) {
    if (!item.id) continue;
    map.set(item.id, {
      viewCount: Number(item.statistics?.viewCount ?? 0),
      duration: item.contentDetails?.duration,
      lang: item.snippet?.defaultAudioLanguage ?? item.snippet?.defaultLanguage,
    });
  }
  return map;
}

export function createYoutubeVideoSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search YouTube for videos using the official YouTube Data API. Returns titles, links, channel names, durations, view counts, and upload dates with direct thumbnails. Every result is an embeddable YouTube video. Pass recency ("day"|"week"|"month"|"year") to restrict to recently uploaded videos. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: youtubeVideoSearchSchema,
    execute: async ({ query, count: reqCount, recency, lang }: YoutubeVideoSearchInput) => {
      const cfg = deps.getLiveConfig().youtube;
      if (!cfg.enabled || !cfg.apiKey || !cfg.videos.enabled) {
        return { results: [], error: 'YouTube video search is not enabled' };
      }

      const num = Math.min(reqCount ?? cfg.videos.results, cfg.videos.results, 50);

      const params = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        videoEmbeddable: 'true',
        q: query,
        maxResults: String(num),
        order: recency ? 'date' : 'relevance',
        key: cfg.apiKey,
      });
      const langParam = lang ?? deps.defaultLang;
      if (langParam) params.set('relevanceLanguage', langParam);
      const publishedAfter = publishedAfterFor(recency);
      if (publishedAfter) params.set('publishedAfter', publishedAfter);

      deps.logger.log(`YouTube video search for "${query}"`);
      const res = await fetchWithTimeout(`${SEARCH_URL}?${params}`, {}, { timeoutMs: SEARCH_TIMEOUT_MS }).catch(
        (err: unknown) => {
          deps.logger.warn(
            `YouTube video search failed for "${query}": ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`,
          );
          throw err;
        },
      );
      if (!res.ok) {
        const reason = await readErrorReason(res);
        deps.logger.warn(
          `YouTube video search failed for "${query}" — HTTP ${res.status}${reason ? ` (${reason})` : ''}`,
        );
        return { results: [], error: `HTTP ${res.status}` };
      }

      const data = (await res.json()) as YoutubeSearchResponse;
      const items = (data.items ?? []).filter((item) => item.id?.videoId);
      if (!items.length) {
        deps.logger.warn(`YouTube returned 0 results for "${query}"`);
        return { results: [] };
      }

      const stats = await fetchYoutubeVideoStats(
        items.map((item) => item.id!.videoId!),
        cfg.apiKey,
        deps.logger,
      );

      const results = items.map((item) => mapYoutubeVideoResult(item, stats));

      deps.logger.log(`YouTube video search returned ${results.length} results for "${query}"`);
      return { results };
    },
  });
}
