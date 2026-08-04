import { tool } from 'ai';
import { z } from 'zod';

import { isTrustedImageUrl } from '../../../harness/helpers/is-trusted-image-url.helper.js';
import { localizedQuerySuffix } from '../../../harness/helpers/localized-query-suffix.helper.js';

import { applyLocaleParams } from './apply-locale-params.helper.js';
import {
  applyRecencyParam,
  type SearchRecency,
} from './apply-recency-param.helper.js';
import { requestBrightData } from './bright-data-client.js';
import { buildYoutubeThumbnailUrl } from './build-youtube-thumbnail-url.helper.js';
import {
  meetsMinimumImageDimensions,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from './image-search.constants.js';
import { BRIGHT_DATA_TIMEOUT_MS } from './search-timeout.js';
import {
  STANDALONE_QUERY_DESCRIPTION,
  STANDALONE_QUERY_TOOL_CLAUSE,
} from './standalone-query.constants.js';
import type { ToolDependencies } from './types.js';

const RECENCY_DESCRIPTION =
  'Restrict results to the given past period (day=24 hours, week=7 days, month=1 month, year=1 year). Use for fresh content such as news, recent releases, or trending topics; leave unset for evergreen, historical, or general queries.';

const SOURCE = 'brightData';

/**
 * Build a google.com search URL for Bright Data's SERP API. Bright Data
 * requires `q` to be the first argument and returns parsed JSON when
 * `brd_json=1` is appended. Google now serves all search types through
 * google.com with `udm`/`tbm` selecting the vertical.
 */
function buildGoogleUrl(
  query: string,
  params: Record<string, unknown>,
): string {
  const search = new URLSearchParams();
  search.set('q', query);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  search.set('brd_json', '1');
  return `https://www.google.com/search?${search.toString()}`;
}

/** Assert the engine is configured and the endpoint enabled. */
function engineEnabled(
  deps: ToolDependencies,
  endpoint: keyof ReturnType<ToolDependencies['getLiveConfig']>['brightData'],
): string | undefined {
  const cfg = deps.getLiveConfig().brightData;
  if (!cfg.enabled || !cfg.apiKey || !cfg.serpZone) return undefined;
  const ep = cfg[endpoint];
  if (typeof ep === 'object' && ep !== null && 'enabled' in ep && !ep.enabled)
    return undefined;
  return cfg.apiKey;
}

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

const IMAGE_SIZE_BUCKETS = [
  { mp: 0.12, label: 'qsvga' },
  { mp: 0.307, label: 'vga' },
  { mp: 0.48, label: 'svga' },
  { mp: 0.786, label: 'xga' },
  { mp: 2, label: '2mp' },
  { mp: 4, label: '4mp' },
  { mp: 6, label: '6mp' },
  { mp: 8, label: '8mp' },
  { mp: 10, label: '10mp' },
  { mp: 12, label: '12mp' },
  { mp: 15, label: '15mp' },
  { mp: 20, label: '20mp' },
  { mp: 40, label: '40mp' },
  { mp: 70, label: '70mp' },
] as const;

function tbsSizeLabelForPixels(pixels: number): string {
  const targetMp = pixels / 1_000_000;
  const selected =
    IMAGE_SIZE_BUCKETS.findLast((bucket) => bucket.mp <= targetMp) ??
    IMAGE_SIZE_BUCKETS[IMAGE_SIZE_BUCKETS.length - 1];
  return selected.label;
}

export function createBrightDataImageSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for images using Bright Data SERP API (Google Images). Returns image URLs, source pages, and dimensions. The tool enforces a minimum of 1280×720 (720p) server-side and drops untrusted domains such as Google thumbnail proxies (encrypted-tbn*.gstatic.com), data URIs, localhost, and private IPs. Pass minWidth/minHeight to request higher resolutions. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          `${STANDALONE_QUERY_DESCRIPTION} Add short visual qualifiers describing the subject.`,
        ),
      count: z.number().optional().describe('Number of results (max 100)'),
      minWidth: z
        .number()
        .optional()
        .describe('Minimum image width in pixels (floor 1280 / 720p).'),
      minHeight: z
        .number()
        .optional()
        .describe('Minimum image height in pixels (floor 720 / 720p).'),
      lang: z
        .string()
        .optional()
        .describe(
          'Two-letter ISO language code for result preference (e.g. en, de, ja)',
        ),
      recency: z
        .enum(['day', 'week', 'month', 'year'])
        .optional()
        .describe(RECENCY_DESCRIPTION),
    }),
    execute: async ({
      query,
      count: reqCount,
      minWidth: requestedMinWidth,
      minHeight: requestedMinHeight,
      lang,
      recency,
    }: {
      query: string;
      count?: number;
      minWidth?: number;
      minHeight?: number;
      lang?: string;
      recency?: SearchRecency;
    }) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'images');
      if (!apiKey)
        return {
          results: [],
          error: 'Bright Data image search is not enabled',
        };

      const minWidth = Math.max(requestedMinWidth ?? 0, MIN_IMAGE_WIDTH);
      const minHeight = Math.max(requestedMinHeight ?? 0, MIN_IMAGE_HEIGHT);

      deps.logger.log(
        `Bright Data image search for "${query}" min ${minWidth}x${minHeight}`,
      );
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      applyRecencyParam(body, recency);
      const tbs = `isz:lt,islt:${tbsSizeLabelForPixels(minWidth * minHeight)}`;
      const url = buildGoogleUrl(query, {
        udm: 2,
        hl: body.hl,
        gl: body.gl,
        tbs: body.tbs ? `${body.tbs},${tbs}` : tbs,
        num: reqCount ?? cfg.images.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as {
          images?: Array<{
            title?: string;
            image?: string;
            image_url?: string;
            imageUrl?: string;
            link?: string;
            source_link?: string;
            width?: number;
            height?: number;
            source?: string;
          }>;
        };
        const images = data.images ?? [];
        if (!images.length) {
          deps.logger.warn(
            `Bright Data image search returned 0 results for "${query}"`,
          );
          return { results: [] };
        }
        const results = images
          .map((r) => ({
            title: r.title || '',
            imageUrl: r.image || r.image_url || r.imageUrl || '',
            sourcePageUrl: r.source_link || r.link || '',
            width: r.width,
            height: r.height,
            source: r.source || '',
            domain: '',
          }))
          .filter((r) => {
            if (!isTrustedImageUrl(r.imageUrl)) return false;
            return meetsMinimumImageDimensions(
              r.width,
              r.height,
              minWidth,
              minHeight,
            );
          });
        deps.logger.log(
          `Bright Data image search returned ${results.length} results for "${query}"`,
        );
        return { results };
      } catch (err) {
        deps.logger.warn(
          `Bright Data image search failed for "${query}": ${String(err)}`,
        );
        return { results: [] };
      }
    },
  });
}

export function createBrightDataNewsSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the latest news using Bright Data SERP API. Returns headlines, sources, dates, and snippets. Pass recency ("day"|"week"|"month"|"year") to restrict to a recent period. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          `${STANDALONE_QUERY_DESCRIPTION} Include the newsworthy angle (announcement, release, event, update).`,
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
      const apiKey = engineEnabled(deps, 'news');
      if (!apiKey)
        return { results: [], error: 'Bright Data news search is not enabled' };

      deps.logger.log(`Bright Data news search for "${query}"`);
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      applyRecencyParam(body, recency);
      const url = buildGoogleUrl(query, {
        tbm: 'nws',
        hl: body.hl,
        gl: body.gl,
        tbs: body.tbs,
        num: reqCount ?? cfg.news.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as {
          news?: Array<{
            title: string;
            link: string;
            description: string;
            date: string;
            source: string;
            image_url?: string;
          }>;
        };
        const news = data.news ?? [];
        if (!news.length) return { results: [] };
        const results = news.map((r) => ({
          title: r.title,
          snippet: (r.description || '').slice(0, 300),
          url: r.link,
          source: r.source || SOURCE,
          date: r.date || '',
          imageUrl: r.image_url || '',
        }));
        deps.logger.log(
          `Bright Data news returned ${results.length} results for "${query}"`,
        );
        return { results };
      } catch (err) {
        deps.logger.warn(
          `Bright Data news search failed for "${query}": ${String(err)}`,
        );
        return { results: [] };
      }
    },
  });
}

export function createBrightDataPlacesSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for places and businesses using Bright Data SERP API (Google Maps local results). Returns names, addresses, ratings, review counts, and coordinates. Phrase the query like a Google Maps search: a business name, a business type, or a business type plus location (e.g. "MediaMarkt Berlin", "coffee shops in Munich").',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'A standalone places search query that explicitly names the business or business type plus location (e.g. "MediaMarkt Berlin", "coffee shops in Munich").',
        ),
      count: z.number().optional().describe('Number of results (max 100)'),
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
      lang,
    }: {
      query: string;
      count?: number;
      lang?: string;
    }) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'places');
      if (!apiKey)
        return {
          results: [],
          error: 'Bright Data places search is not enabled',
        };

      deps.logger.log(`Bright Data places search for "${query}"`);
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      const url = buildGoogleUrl(query, {
        tbm: 'lcl',
        hl: body.hl,
        gl: body.gl,
        num: reqCount ?? cfg.places.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as {
          local_results?: Array<{
            title?: string;
            address?: string;
            phone?: string;
            latitude?: number;
            longitude?: number;
            rating?: number;
            reviews_cnt?: number;
            type?: string;
            website?: string;
          }>;
          places?: Array<{
            title?: string;
            address?: string;
            phone?: string;
            latitude?: number;
            longitude?: number;
            rating?: number;
            reviews_cnt?: number;
            type?: string;
            website?: string;
          }>;
        };
        const places = data.local_results ?? data.places ?? [];
        if (!places.length) {
          deps.logger.warn(
            `Bright Data places returned 0 results for "${query}"`,
          );
          return { results: [] };
        }
        const results = places.map((r) => ({
          title: r.title || '',
          address: r.address || '',
          phoneNumber: r.phone || '',
          latitude: r.latitude,
          longitude: r.longitude,
          rating: r.rating,
          ratingCount: r.reviews_cnt,
          type: r.type || '',
          website: r.website || '',
        }));
        return { results };
      } catch (err) {
        deps.logger.warn(
          `Bright Data places search failed for "${query}": ${String(err)}`,
        );
        return { results: [] };
      }
    },
  });
}

export function createBrightDataShoppingSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for products using Bright Data SERP API (Google Shopping). Returns prices, sellers, images, and ratings. Phrase the query as the bare product name with model number (e.g. "Sony WH-1000XM5") — do NOT add words like "review", "test", or long descriptive sentences.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'The exact product name with model number, kept short and standalone.',
        ),
      count: z.number().optional().describe('Number of results (max 100)'),
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
      lang,
    }: {
      query: string;
      count?: number;
      lang?: string;
    }) => {
      const cfg = deps.getLiveConfig().brightData;
      const apiKey = engineEnabled(deps, 'shopping');
      if (!apiKey)
        return {
          results: [],
          error: 'Bright Data shopping search is not enabled',
        };

      deps.logger.log(`Bright Data shopping search for "${query}"`);
      const body: Record<string, unknown> = {};
      applyLocaleParams(body, lang ?? deps.defaultLang);
      const url = buildGoogleUrl(query, {
        udm: 28,
        hl: body.hl,
        gl: body.gl,
        num: reqCount ?? cfg.shopping.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as {
          shopping?: Array<{
            title?: string;
            link?: string;
            price?: string;
            source?: string;
            image_url?: string;
            image?: string;
            delivery?: string;
            rating?: number;
            rating_count?: number;
          }>;
        };
        const shopping = data.shopping ?? [];
        if (!shopping.length) {
          deps.logger.warn(
            `Bright Data shopping returned 0 results for "${query}"`,
          );
          return { results: [] };
        }
        const results = shopping.map((r) => ({
          title: r.title || '',
          price: r.price || '',
          link: r.link || '',
          source: r.source || '',
          imageUrl: r.image_url || r.image || '',
          delivery: r.delivery || '',
          rating: r.rating,
          ratingCount: r.rating_count,
        }));
        return { results };
      } catch (err) {
        deps.logger.warn(
          `Bright Data shopping search failed for "${query}": ${String(err)}`,
        );
        return { results: [] };
      }
    },
  });
}

export function createBrightDataVideoSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for videos using Bright Data SERP API. Returns titles, links, channel names, duration, and publish dates. Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms. Pass recency ("day"|"week"|"month"|"year") to restrict to recently uploaded videos. ' +
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
        tbm: 'vid',
        hl: body.hl,
        gl: body.gl,
        tbs: body.tbs,
        num: reqCount ?? cfg.videos.results,
      });
      try {
        const data = (await requestBrightData(apiKey, cfg.serpZone!, url, {
          timeoutMs: BRIGHT_DATA_TIMEOUT_MS,
        })) as {
          videos?: Array<{
            title?: string;
            link?: string;
            description?: string;
            channel?: string;
            duration?: string;
            date?: string;
            views?: number;
          }>;
        };
        const videos = data.videos ?? [];
        if (!videos.length) return { results: [] };
        const results = videos.map((r) => ({
          title: r.title || '',
          link: r.link || '',
          snippet: r.description || '',
          channel: r.channel || '',
          duration: r.duration || '',
          date: r.date || '',
          thumbnailUrl: buildYoutubeThumbnailUrl(r.link || '') ?? '',
          source: SOURCE,
          views: r.views ?? 0,
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

export function createBrightDataWebpageScrape(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch and render a full webpage using Bright Data Web Unlocker API. Returns clean Markdown text with its title. Use for pages behind anti-bot protection that plain fetch cannot reach.',
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch and render'),
    }),
    execute: async ({ url }: { url: string }) => {
      const cfg = deps.getLiveConfig().brightData;
      if (!cfg.enabled || !cfg.apiKey || !cfg.unlockerZone) {
        return {
          content: '',
          error: 'Bright Data webpage scrape is not enabled',
        };
      }
      if (!cfg.scrape.enabled) {
        return {
          content: '',
          error: 'Bright Data webpage scrape is not enabled',
        };
      }

      deps.logger.log(`Bright Data webpage scrape for "${url}"`);
      try {
        const data = (await requestBrightData(
          cfg.apiKey,
          cfg.unlockerZone,
          url,
          { markdown: true, timeoutMs: BRIGHT_DATA_TIMEOUT_MS },
        )) as { text?: string };
        const content = data.text || '';
        deps.logger.log(
          `Bright Data webpage scraped ${content.length} chars from "${url}"`,
        );
        return { content: content.slice(0, 8000), title: '' };
      } catch (err) {
        deps.logger.warn(
          `Bright Data webpage scrape failed for "${url}": ${String(err)}`,
        );
        return { content: '', error: String(err) };
      }
    },
  });
}
