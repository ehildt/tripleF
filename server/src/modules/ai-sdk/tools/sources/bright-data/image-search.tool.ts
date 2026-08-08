import { tool } from 'ai';

import { isTrustedImageUrl } from '../../../../harness/helpers/url-trust/is-trusted-image-url.helper.js';
import { applyLocaleParams } from '../apply-locale-params.helper.js';
import { applyRecencyParam } from '../apply-recency-param.helper.js';
import { requestBrightData } from '../bright-data-client.js';
import {
  meetsMinimumImageDimensions,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from '../image-search.constants.js';
import { tbsSizeLabelForPixels } from '../image-size-buckets.js';
import { BRIGHT_DATA_TIMEOUT_MS } from '../search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../standalone-query.constants.js';
import type { ToolDependencies } from '../types.js';

import { buildGoogleUrl, engineEnabled } from './bright-data.constants.js';
import {
  type BrightDataImageSearchInput,
  brightDataImageSearchSchema,
} from './image-search.schema.js';
import type { BrightDataImageSearchResponse } from './image-search.types.js';

export function createBrightDataImageSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for images using Bright Data SERP API (Google Images). Returns image URLs and source pages. The tool passes the appropriate Google Images `tbs=isz:lt,islt:<bucket>` size filter server-side and trusts it for minimum resolution (Bright Data does not return pixel dimensions), while still rejecting untrusted domains such as Google thumbnail proxies (encrypted-tbn*.gstatic.com), data URIs, localhost, and private IPs. Pass minWidth/minHeight to request higher resolutions. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: brightDataImageSearchSchema,
    execute: async ({
      query,
      count: reqCount,
      minWidth: requestedMinWidth,
      minHeight: requestedMinHeight,
      lang,
      recency,
    }: BrightDataImageSearchInput) => {
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
      // Images are language-agnostic: only bias toward a locale when the user
      // explicitly requested a specific language via `lang`. Never fall back
      // to the UI language automatically.
      applyLocaleParams(body, lang);
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
        })) as BrightDataImageSearchResponse;
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
            // Prefer the real image URL; `image` is a base64 thumbnail data
            // URI that our trust rules reject.
            imageUrl:
              r.original_image || r.image_url || r.imageUrl || r.link || '',
            sourcePageUrl: r.source_link || r.link || '',
            width: r.width,
            height: r.height,
            source: r.source || '',
            domain: '',
          }))
          .filter((r) => {
            if (!isTrustedImageUrl(r.imageUrl)) return false;
            // Bright Data does not return pixel dimensions, so trust the
            // Google-side `tbs=isz:lt,islt:<bucket>` filter. Only enforce the
            // minimum when dimensions happen to be present.
            const w = r.width ?? 0;
            const h = r.height ?? 0;
            if (!w || !h) return true;
            return meetsMinimumImageDimensions(w, h, minWidth, minHeight);
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
