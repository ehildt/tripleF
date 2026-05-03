import { tool } from 'ai';
import { z } from 'zod';

import { isTrustedImageUrl } from '../../../harness/helpers/is-trusted-image-url.helper.js';
import { filterLiveUrls } from '../url-checker.js';

import { fetchWithTimeout } from './fetch-with-timeout.js';
import {
  meetsMinimumImageDimensions,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from './image-search.constants.js';
import { SEARCH_TIMEOUT_MS } from './search-timeout.js';
import type { ToolDependencies } from './types.js';

const HEADERS = (apiKey: string) => ({
  'X-API-KEY': apiKey,
  'Content-Type': 'application/json',
});

export function createSerperWebSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the web using Serper.dev (Google results). Returns organic results with titles, snippets, and links.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    execute: async ({ query }: { query: string }) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.web.enabled) {
        return { results: [], error: 'Serper.dev web search is not enabled' };
      }

      deps.logger.log(`Serper.dev search for "${query}"`);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/search',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify({ q: query, num: cfg.web.results }),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) {
        deps.logger.warn(`Serper.dev returned ${res.status} for "${query}"`);
        return { results: [] };
      }
      const data = (await res.json()) as {
        organic?: Array<{ title: string; link: string; snippet: string }>;
      };
      if (!data.organic?.length) {
        deps.logger.warn(`Serper.dev returned 0 results for "${query}"`);
        return { results: [] };
      }
      const results = data.organic.map((r) => ({
        title: r.title,
        snippet: (r.snippet || '').slice(0, 300),
        url: r.link,
        source: 'serper',
      }));
      deps.logger.log(
        `Serper.dev returned ${results.length} results for "${query}"`,
      );
      return { results };
    },
  });
}

const IMAGE_SIZE_BUCKETS = [
  { mp: 0.12, label: 'qsvga' }, // > 400×300
  { mp: 0.307, label: 'vga' }, // > 640×480
  { mp: 0.48, label: 'svga' }, // > 800×600
  { mp: 0.786, label: 'xga' }, // > 1024×768
  { mp: 2, label: '2mp' }, // > 2 MP
  { mp: 4, label: '4mp' }, // > 4 MP
  { mp: 6, label: '6mp' }, // > 6 MP
  { mp: 8, label: '8mp' }, // > 8 MP
  { mp: 10, label: '10mp' }, // > 10 MP
  { mp: 12, label: '12mp' }, // > 12 MP
  { mp: 15, label: '15mp' }, // > 15 MP
  { mp: 20, label: '20mp' }, // > 20 MP
  { mp: 40, label: '40mp' }, // > 40 MP
  { mp: 70, label: '70mp' }, // > 70 MP
] as const;

/**
 * Choose the Google Images size bucket whose threshold is the largest one
 * that is still <= the requested pixel area. `isz:lt,islt:<label>` means
 * "images larger than the bucket's threshold", so using the largest threshold
 * below the target returns the broadest result set that can satisfy the target.
 *
 * Examples:
 * - 1280×720 (0.92 MP) -> xga (>1024×768)
 * - 1920×1080 (2.07 MP) -> 2mp (>2 MP)
 * - 3840×2160 (8.29 MP) -> 8mp (>8 MP)
 */
function tbsSizeLabelForPixels(pixels: number): string {
  const targetMp = pixels / 1_000_000;
  let selected = IMAGE_SIZE_BUCKETS[IMAGE_SIZE_BUCKETS.length - 1];
  for (const bucket of IMAGE_SIZE_BUCKETS) {
    if (bucket.mp <= targetMp) {
      selected = bucket;
    }
  }
  return selected.label;
}

export function createSerperImageSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for images using Serper.dev (Google Images). Returns image URLs, thumbnails, source pages, and dimensions. The tool prefers 2560×1440 (1440p) images and always enforces a minimum of 1280×720 (720p). It passes the appropriate Google Images `tbs=isz:lt,islt:<bucket>` size filter server-side, drops any returned images whose dimensions are below 1280×720, and rejects untrusted domains such as Google thumbnail proxies (encrypted-tbn*.gstatic.com, t*.gstatic.com), data URIs, localhost, and private IPs. You do not need to pass minWidth/minHeight for the default 720p floor. If the user asks for a higher resolution, pass minWidth/minHeight and the tool will pick the smallest Google bucket that can satisfy the requested area. Common reference: 1280×720 (720p) ~0.9 MP, 1920×1080 (1080p) ~2 MP, 2560×1440 (1440p) ~3.7 MP, 3840×2160 (4K) ~8.3 MP.',
    inputSchema: z.object({
      query: z.string().describe('The image search query'),
      count: z.number().optional().describe('Number of results (max 100)'),
      minWidth: z
        .number()
        .optional()
        .describe(
          'Minimum image width in pixels. Use 1920 when the user wants 1080p-quality images, 2560 for 1440p, 3840 for 4K. The tool always enforces a floor of 1280 (720p).',
        ),
      minHeight: z
        .number()
        .optional()
        .describe(
          'Minimum image height in pixels. Use 1080 when the user wants 1080p-quality images, 1440 for 1440p, 2160 for 4K. The tool always enforces a floor of 720 (720p).',
        ),
    }),
    execute: async ({
      query,
      count: reqCount,
      minWidth: requestedMinWidth,
      minHeight: requestedMinHeight,
    }: {
      query: string;
      count?: number;
      minWidth?: number;
      minHeight?: number;
    }) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.images.enabled) {
        return {
          results: [],
          error: 'Serper.dev image search is not enabled',
        };
      }

      const minWidth = Math.max(requestedMinWidth ?? 0, MIN_IMAGE_WIDTH);
      const minHeight = Math.max(requestedMinHeight ?? 0, MIN_IMAGE_HEIGHT);

      deps.logger.log(
        `Serper.dev Image Search for "${query}" min ${minWidth}x${minHeight}`,
      );
      const num = Math.min(reqCount ?? cfg.images.results, cfg.images.results);
      const body: Record<string, unknown> = { q: query, num };
      const targetPixels = minWidth * minHeight;
      body.tbs = `isz:lt,islt:${tbsSizeLabelForPixels(targetPixels)}`;
      const res = await fetchWithTimeout(
        'https://google.serper.dev/images',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify(body),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) {
        deps.logger.warn(
          `Serper.dev Image Search returned ${res.status} for "${query}"`,
        );
        return { results: [] };
      }
      const data = (await res.json()) as {
        images?: Array<{
          title?: string;
          imageUrl?: string;
          image?: string;
          link?: string;
          imageWidth?: number;
          imageHeight?: number;
          width?: number;
          height?: number;
        }>;
      };
      if (!data.images?.length) {
        deps.logger.warn(
          `Serper.dev Image Search returned 0 results for "${query}"`,
        );
        return { results: [] };
      }
      const results = data.images
        .map((r) => ({
          title: r.title || '',
          imageUrl: r.imageUrl || r.image || '',
          sourcePageUrl: r.link || '',
          width: r.imageWidth ?? r.width,
          height: r.imageHeight ?? r.height,
          source: 'serper',
        }))
        .filter((r) => {
          if (!isTrustedImageUrl(r.imageUrl)) return false;
          const w = r.width ?? 0;
          const h = r.height ?? 0;
          if (!w || !h) return true;
          return meetsMinimumImageDimensions(w, h, minWidth, minHeight);
        });
      deps.logger.log(
        `Serper.dev Image Search returned ${results.length} results for "${query}"`,
      );
      return { results };
    },
  });
}

export function createSerperNewsSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search the latest news using Serper.dev. Returns headlines, sources, dates, and snippets.',
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
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.news.enabled) {
        return { results: [], error: 'Serper.dev news is not enabled' };
      }

      deps.logger.log(`Serper.dev News search for "${query}"`);
      const num = Math.min(reqCount ?? cfg.news.results, cfg.news.results);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/news',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify({ q: query, num }),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [] };
      const data = (await res.json()) as {
        news?: Array<{
          title: string;
          link: string;
          snippet: string;
          date: string;
          source: string;
          imageUrl?: string;
        }>;
      };
      if (!data.news?.length) return { results: [] };
      const results = data.news.map((r) => ({
        title: r.title,
        snippet: r.snippet || '',
        url: r.link,
        source: r.source || '',
        date: r.date || '',
        imageUrl: r.imageUrl || '',
      }));
      return { results };
    },
  });
}

export function createSerperPlacesSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for places and businesses using Serper.dev. Returns addresses, phone numbers, ratings, and coordinates.',
    inputSchema: z.object({
      query: z.string().describe('The places search query'),
      count: z.number().optional().describe('Number of results (max 100)'),
    }),
    execute: async ({
      query,
      count: reqCount,
    }: {
      query: string;
      count?: number;
    }) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.places.enabled) {
        return { results: [], error: 'Serper.dev places is not enabled' };
      }

      deps.logger.log(`Serper.dev Places search for "${query}"`);
      const num = Math.min(reqCount ?? cfg.places.results, cfg.places.results);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/places',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify({ q: query, num }),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) {
        return { results: [], error: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as {
        places?: Array<{
          title: string;
          address: string;
          phoneNumber?: string;
          latitude?: number;
          longitude?: number;
          rating?: number;
          ratingCount?: number;
          reviews?: string;
          thumbnailUrl?: string;
        }>;
      };
      if (!data.places?.length) {
        deps.logger.warn(`Serper.dev Places returned 0 results for "${query}"`);
        return { results: [] };
      }
      const results = data.places.map((r) => ({
        title: r.title,
        address: r.address || '',
        phoneNumber: r.phoneNumber || '',
        latitude: r.latitude,
        longitude: r.longitude,
        rating: r.rating,
        ratingCount: r.ratingCount,
        reviews: r.reviews || '',
        thumbnailUrl: r.thumbnailUrl || '',
      }));
      return { results };
    },
  });
}

export function createSerperShoppingSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for products using Serper.dev. Returns prices, sources, images, and ratings.',
    inputSchema: z.object({
      query: z.string().describe('The shopping search query'),
      count: z.number().optional().describe('Number of results (max 100)'),
    }),
    execute: async ({
      query,
      count: reqCount,
    }: {
      query: string;
      count?: number;
    }) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.shopping.enabled) {
        return {
          results: [],
          error: 'Serper.dev shopping is not enabled',
        };
      }

      deps.logger.log(`Serper.dev Shopping search for "${query}"`);
      const num = Math.min(
        reqCount ?? cfg.shopping.results,
        cfg.shopping.results,
      );
      const res = await fetchWithTimeout(
        'https://google.serper.dev/shopping',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify({ q: query, num }),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [], error: `HTTP ${res.status}` };
      const data = (await res.json()) as {
        shopping?: Array<{
          title: string;
          link: string;
          price: string;
          source: string;
          imageUrl?: string;
          delivery?: string;
          rating?: number;
          ratingCount?: number;
        }>;
      };
      if (!data.shopping?.length) {
        deps.logger.warn(
          `Serper.dev Shopping returned 0 results for "${query}"`,
        );
        return { results: [] };
      }
      let results = data.shopping.map((r) => ({
        title: r.title,
        price: r.price || '',
        link: r.link || '',
        source: r.source || '',
        imageUrl: r.imageUrl || '',
        delivery: r.delivery || '',
        rating: r.rating,
        ratingCount: r.ratingCount,
      }));
      const { live: liveUrls } = await filterLiveUrls(
        results.map((r) => r.link),
      );
      results = results.filter((r) => liveUrls.has(r.link));
      return { results };
    },
  });
}

export function createSerperReviewsSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for reviews using Serper.dev. Returns ratings, snippets, sources, and dates.',
    inputSchema: z.object({
      query: z.string().describe('The reviews search query'),
      count: z.number().optional().describe('Number of results (max 100)'),
    }),
    execute: async ({
      query,
      count: reqCount,
    }: {
      query: string;
      count?: number;
    }) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.reviews.enabled) {
        return {
          results: [],
          error: 'Serper.dev reviews is not enabled',
        };
      }

      deps.logger.log(`Serper.dev Reviews search for "${query}"`);
      const num = Math.min(
        reqCount ?? cfg.reviews.results,
        cfg.reviews.results,
      );
      const res = await fetchWithTimeout(
        'https://google.serper.dev/reviews',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify({ q: query, num }),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [], error: `HTTP ${res.status}` };
      const data = (await res.json()) as {
        reviews?: Array<{
          title?: string;
          snippet?: string;
          link?: string;
          rating?: number;
          date?: string;
          source?: string;
          reviewLink?: string;
        }>;
      };
      if (!data.reviews?.length) {
        deps.logger.warn(
          `Serper.dev Reviews returned 0 results for "${query}"`,
        );
        return { results: [] };
      }
      let results = data.reviews.map((r) => ({
        title: r.title || '',
        snippet: r.snippet || '',
        link: r.link || '',
        rating: r.rating,
        date: r.date || '',
        source: r.source || '',
        reviewLink: r.reviewLink || '',
      }));
      const { live: liveUrls } = await filterLiveUrls(
        results.map((r) => r.link),
      );
      results = results.filter((r) => liveUrls.has(r.link));
      return { results };
    },
  });
}

export function createSerperVideoSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for videos using Serper.dev. Returns titles, links, channel names, duration, and publish dates. Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms.',
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
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.videos.enabled) {
        return { results: [], error: 'Serper.dev videos is not enabled' };
      }

      deps.logger.log(`Serper.dev Video search for "${query}"`);
      const num = Math.min(reqCount ?? cfg.videos.results, cfg.videos.results);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/videos',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify({ q: query, num }),
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
        imageUrl: r.imageUrl || '',
        views: r.views ?? 0,
      }));
      deps.logger.log(
        `Serper.dev Video search returned ${results.length} results for "${query}"`,
      );
      return { results };
    },
  });
}

export function createSerperWebpageFetch(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch and render a full webpage using Serper.dev scrape API. Returns clean rendered text with its title.',
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch and render'),
    }),
    execute: async ({ url }: { url: string }) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.apiKey || !cfg.webpageFetch.enabled) {
        return {
          content: '',
          error: 'Serper.dev webpage fetch is not enabled',
        };
      }

      deps.logger.log(`Serper.dev Webpage scrape for "${url}"`);
      const res = await fetchWithTimeout(
        'https://scrape.serper.dev',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify({ url }),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) {
        deps.logger.warn(
          `Serper.dev Webpage scrape returned ${res.status} for "${url}"`,
        );
        return { content: '', error: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as { text?: string; title?: string };
      const content = data.text || '';
      const title = data.title || '';
      deps.logger.log(
        `Serper.dev Webpage scraped ${content.length} chars from "${url}"`,
      );
      return { content: content.slice(0, 8000), title };
    },
  });
}
