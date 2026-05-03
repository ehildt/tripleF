import { tool } from 'ai';
import { z } from 'zod';

import { isTrustedImageUrl } from '../../../harness/helpers/is-trusted-image-url.helper.js';

import { fetchWithTimeout } from './fetch-with-timeout.js';
import {
  meetsMinimumImageDimensions,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from './image-search.constants.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import type { ToolDependencies } from './types.js';

export function createBraveWebSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the web using Brave Search API. Returns organic results with titles, descriptions, and URLs.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    execute: async ({ query }: { query: string }) => {
      const cfg = deps.getLiveConfig().brave;
      if (!cfg.enabled || !cfg.apiKey || !cfg.web.enabled) {
        return { results: [], error: 'Brave web search is not enabled' };
      }

      deps.logger.log(`Brave API search for "${query}"`);
      const count = cfg.web.results;
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
      const res = await fetchWithTimeout(
        url,
        {
          headers: {
            'X-Subscription-Token': cfg.apiKey,
            Accept: 'application/json',
          },
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [] };
      const data = (await res.json()) as {
        web?: {
          results?: Array<{ title: string; description: string; url: string }>;
        };
      };
      if (!data.web?.results?.length) {
        deps.logger.warn(`Brave API returned 0 results for "${query}"`);
        return { results: [] };
      }
      const results = data.web.results.map((r) => ({
        title: r.title,
        snippet: (r.description || '').slice(0, 300),
        url: r.url,
        source: 'brave',
      }));
      deps.logger.log(
        `Brave API returned ${results.length} results for "${query}"`,
      );
      return { results };
    },
  });
}

export function createBraveImageSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for images using Brave Image Search. Returns image URLs, thumbnails, and source pages. The tool prefers 2560×1440 (1440p) images and always enforces a minimum of 1280×720 (720p). Note: the Brave Image Search API does not expose a server-side size filter, so the tool requests results and then drops any images whose dimensions are below 1280×720. It also rejects untrusted domains such as Google thumbnail proxies (encrypted-tbn*.gstatic.com, t*.gstatic.com), data URIs, localhost, and private IPs. If the user asks for a higher resolution, pass minWidth/minHeight; those values are applied as an additional client-side floor on top of the 720p minimum.',
    inputSchema: z.object({
      query: z.string().describe('The image search query'),
      count: z.number().optional().describe('Number of results (max 200)'),
      minWidth: z
        .number()
        .optional()
        .describe(
          'Minimum image width in pixels. The tool always enforces a floor of 1280 (720p).',
        ),
      minHeight: z
        .number()
        .optional()
        .describe(
          'Minimum image height in pixels. The tool always enforces a floor of 720 (720p).',
        ),
      safesearch: z
        .enum(['strict', 'off'])
        .optional()
        .default('strict')
        .describe('Safe search filter'),
      country: z.string().optional().describe('Country code (e.g. US, JP)'),
      search_lang: z
        .string()
        .optional()
        .describe('Language code (e.g. en, ja)'),
    }),
    execute: async ({
      query,
      safesearch,
      country,
      search_lang,
      minWidth: requestedMinWidth,
      minHeight: requestedMinHeight,
    }: {
      query: string;
      safesearch?: string;
      country?: string;
      search_lang?: string;
      minWidth?: number;
      minHeight?: number;
    }) => {
      const cfg = deps.getLiveConfig().brave;
      if (!cfg.enabled || !cfg.apiKey || !cfg.images.enabled) {
        return { results: [], error: 'Brave image search is not enabled' };
      }

      const minWidth = Math.max(requestedMinWidth ?? 0, MIN_IMAGE_WIDTH);
      const minHeight = Math.max(requestedMinHeight ?? 0, MIN_IMAGE_HEIGHT);

      deps.logger.log(
        `Brave Image Search for "${query}" min ${minWidth}x${minHeight}`,
      );
      const params = new URLSearchParams({
        q: query,
        count: String(cfg.images.results),
        safesearch: safesearch ?? 'strict',
      });
      if (country) params.set('country', country);
      if (search_lang) params.set('search_lang', search_lang);

      const url = `https://api.search.brave.com/res/v1/images/search?${params}`;
      const res = await fetchWithTimeout(
        url,
        {
          headers: {
            'X-Subscription-Token': cfg.apiKey,
            Accept: 'application/json',
          },
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) {
        deps.logger.warn(
          `Brave Image Search returned ${res.status} for "${query}"`,
        );
        return { results: [] };
      }
      const data = (await res.json()) as {
        results?: Array<{
          title?: string;
          url?: string;
          image_url?: string;
          thumbnail_src?: string;
          width?: number;
          height?: number;
          description?: string;
          page_url?: string;
          properties?: { url?: string };
        }>;
      };
      if (!data.results?.length) {
        deps.logger.warn(
          `Brave Image Search returned 0 results for "${query}"`,
        );
        return { results: [] };
      }
      const results = data.results
        .filter((r) => r.properties?.url || r.image_url)
        .map((r) => ({
          title: r.title || '',
          imageUrl: r.properties?.url || r.image_url || '',
          thumbnailUrl: r.thumbnail_src || '',
          sourcePageUrl: r.url || r.page_url || '',
          width: r.width,
          height: r.height,
          description: r.description || r.title || '',
          source: 'brave',
        }))
        .filter((r) => {
          if (!isTrustedImageUrl(r.imageUrl)) return false;
          const w = r.width ?? 0;
          const h = r.height ?? 0;
          if (!w || !h) return true;
          return meetsMinimumImageDimensions(w, h, minWidth, minHeight);
        });
      deps.logger.log(
        `Brave Image Search returned ${results.length} results for "${query}"`,
      );
      return { results };
    },
  });
}

export function createBraveNewsSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the latest news using Brave Search API. Returns headlines, sources, dates, and snippets.',
    inputSchema: z.object({
      query: z.string().describe('The news search query'),
      count: z.number().optional().describe('Number of results (max 100)'),
    }),
    execute: async ({
      query,
      count: reqCount,
    }: {
      query: string;
      count?: number;
    }) => {
      const cfg = deps.getLiveConfig().brave;
      if (!cfg.enabled || !cfg.apiKey || !cfg.news.enabled) {
        return { results: [], error: 'Brave news search is not enabled' };
      }

      deps.logger.log(`Brave News search for "${query}"`);
      const count = Math.min(reqCount ?? cfg.news.results, cfg.news.results);
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}&result_filter=news`;
      const res = await fetchWithTimeout(
        url,
        {
          headers: {
            'X-Subscription-Token': cfg.apiKey,
            Accept: 'application/json',
          },
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [] };
      const data = (await res.json()) as {
        news?: {
          results?: Array<{
            title?: string;
            description?: string;
            url?: string;
            age?: string;
            source?: string;
          }>;
        };
      };
      if (!data.news?.results?.length) return { results: [] };
      const results = data.news.results.map((r) => ({
        title: r.title || '',
        snippet: r.description || '',
        url: r.url || '',
        source: r.source || 'brave',
        date: r.age || '',
        imageUrl: '',
      }));
      return { results };
    },
  });
}

export function createBraveVideoSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for videos using Brave Search API. Returns titles, links, descriptions, and publish dates. Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms.',
    inputSchema: z.object({
      query: z.string().describe('The video search query'),
      count: z.number().optional().describe('Number of results (max 100)'),
    }),
    execute: async ({
      query,
      count: reqCount,
    }: {
      query: string;
      count?: number;
    }) => {
      const cfg = deps.getLiveConfig().brave;
      if (!cfg.enabled || !cfg.apiKey || !cfg.video.enabled) {
        return { results: [], error: 'Brave video search is not enabled' };
      }

      deps.logger.log(`Brave Video search for "${query}"`);
      const count = Math.min(reqCount ?? cfg.video.results, cfg.video.results);
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}&result_filter=videos`;
      const res = await fetchWithTimeout(
        url,
        {
          headers: {
            'X-Subscription-Token': cfg.apiKey,
            Accept: 'application/json',
          },
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [] };
      const data = (await res.json()) as {
        videos?: {
          results?: Array<{
            title?: string;
            description?: string;
            url?: string;
            age?: string;
          }>;
        };
      };
      if (!data.videos?.results?.length) return { results: [] };
      const results = data.videos.results.map((r) => ({
        title: r.title || '',
        link: r.url || '',
        snippet: r.description || '',
        date: r.age || '',
        source: 'brave',
      }));
      return { results };
    },
  });
}
