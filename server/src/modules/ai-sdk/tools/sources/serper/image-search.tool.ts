import { tool } from 'ai';
import { z } from 'zod';

import { isTrustedImageUrl } from '../../../../harness/helpers/is-trusted-image-url.helper.js';
import { applyLocaleParams } from '../apply-locale-params.helper.js';
import {
  applyRecencyParam,
  type SearchRecency,
} from '../apply-recency-param.helper.js';
import { fetchWithTimeout } from '../fetch-with-timeout.js';
import {
  meetsMinimumImageDimensions,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from '../image-search.constants.js';
import { tbsSizeLabelForPixels } from '../image-size-buckets.js';
import { RECENCY_DESCRIPTION } from '../recency.constants.js';
import { SEARCH_TIMEOUT_MS } from '../search-timeout.js';
import {
  STANDALONE_QUERY_DESCRIPTION,
  STANDALONE_QUERY_TOOL_CLAUSE,
} from '../standalone-query.constants.js';
import type { ToolDependencies } from '../types.js';

import { HEADERS } from './serper.constants.js';

export function createSerperImageSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for images using Serper.dev (Google Images). Returns image URLs, thumbnails, source pages, and dimensions. The tool prefers 2560×1440 (1440p) images and always enforces a minimum of 1280×720 (720p). It passes the appropriate Google Images `tbs=isz:lt,islt:<bucket>` size filter server-side, drops any returned images whose dimensions are below 1280×720, and rejects untrusted domains such as Google thumbnail proxies (encrypted-tbn*.gstatic.com, t*.gstatic.com), data URIs, localhost, and private IPs. You do not need to pass minWidth/minHeight for the default 720p floor. If the user asks for a higher resolution, pass minWidth/minHeight and the tool will pick the smallest Google bucket that can satisfy the requested area. Common reference: 1280×720 (720p) ~0.9 MP, 1920×1080 (1080p) ~2 MP, 2560×1440 (1440p) ~3.7 MP, 3840×2160 (4K) ~8.3 MP. Pass recency ("day"|"week"|"month"|"year") to restrict to recently published images. ' +
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
        .describe(
          'Minimum image width in pixels. Use 1920 when the user wants 1080p-quality images, 2560 for 1440p, 3840 for 4K. The tool always enforces a floor of 1280 (720p).',
        ),
      minHeight: z
        .number()
        .optional()
        .describe(
          'Minimum image height in pixels. Use 1080 when the user wants 1080p-quality images, 1440 for 1440p, 2160 for 4K. The tool always enforces a floor of 720 (720p).',
        ),
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
      applyLocaleParams(body, lang ?? deps.defaultLang);
      const targetPixels = minWidth * minHeight;
      body.tbs = `isz:lt,islt:${tbsSizeLabelForPixels(targetPixels)}`;
      applyRecencyParam(body, recency);
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
          source?: string;
          domain?: string;
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
          source: r.source || '',
          domain: r.domain || '',
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
