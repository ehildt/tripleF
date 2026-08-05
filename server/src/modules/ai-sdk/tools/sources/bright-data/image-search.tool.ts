import { tool } from 'ai';
import { z } from 'zod';

import { isTrustedImageUrl } from '../../../../harness/helpers/is-trusted-image-url.helper.js';
import { applyLocaleParams } from '../apply-locale-params.helper.js';
import {
  applyRecencyParam,
  type SearchRecency,
} from '../apply-recency-param.helper.js';
import { requestBrightData } from '../bright-data-client.js';
import {
  meetsMinimumImageDimensions,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from '../image-search.constants.js';
import { tbsSizeLabelForPixels } from '../image-size-buckets.js';
import { RECENCY_DESCRIPTION } from '../recency.constants.js';
import { BRIGHT_DATA_TIMEOUT_MS } from '../search-timeout.js';
import {
  STANDALONE_QUERY_DESCRIPTION,
  STANDALONE_QUERY_TOOL_CLAUSE,
} from '../standalone-query.constants.js';
import type { ToolDependencies } from '../types.js';

import { buildGoogleUrl, engineEnabled } from './bright-data.constants.js';

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
