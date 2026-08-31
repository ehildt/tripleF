import { type Tool, tool } from 'ai';

import { isTrustedImageUrl } from '../../schemas/helpers/url-trust/is-trusted-image-url.helper.js';
import { meetsMinimumImageDimensions, MIN_IMAGE_HEIGHT, MIN_IMAGE_WIDTH } from '../constants/image-search.constants.js';
import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';
import { STANDALONE_QUERY_TOOL_CLAUSE } from '../constants/standalone-query.constants.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { applyRecencyParam } from '../helpers/apply-recency-param.helper.js';
import { fetchWithTimeout } from '../helpers/fetch-with-timeout.js';
import { tbsSizeLabelForPixels } from '../helpers/image-size-buckets.js';
import type { ToolDependencies } from '../types/types.js';

import { mapSerperImageResult } from './helpers/map-serper-image-result.helper.js';
import { type SerperImageSearchInput, serperImageSearchSchema } from './image-search.schema.js';
import type { SerperImageSearchResponse } from './image-search.types.js';
import { HEADERS } from './serper.constants.js';

export function createSerperImageSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search for images using Serper.dev (Google Images). Returns image URLs, thumbnails, source pages, and dimensions. The tool prefers 2560×1440 (1440p) images and always enforces a minimum of 1280×720 (720p). It passes the appropriate Google Images `tbs=isz:lt,islt:<bucket>` size filter server-side, drops any returned images whose dimensions are below 1280×720, and rejects untrusted domains such as Google thumbnail proxies (encrypted-tbn*.gstatic.com, t*.gstatic.com), data URIs, localhost, and private IPs. You do not need to pass minWidth/minHeight for the default 720p floor. If the user asks for a higher resolution, pass minWidth/minHeight and the tool will pick the smallest Google bucket that can satisfy the requested area. Common reference: 1280×720 (720p) ~0.9 MP, 1920×1080 (1080p) ~2 MP, 2560×1440 (1440p) ~3.7 MP, 3840×2160 (4K) ~8.3 MP. Pass recency ("day"|"week"|"month"|"year") to restrict to recently published images. ' +
      STANDALONE_QUERY_TOOL_CLAUSE,
    inputSchema: serperImageSearchSchema,
    execute: async ({
      query,
      count: reqCount,
      minWidth: requestedMinWidth,
      minHeight: requestedMinHeight,
      lang,
      recency,
    }: SerperImageSearchInput) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.images.enabled) {
        return {
          results: [],
          error: 'Serper.dev image search is not enabled',
        };
      }

      const minWidth = Math.max(requestedMinWidth ?? 0, MIN_IMAGE_WIDTH);
      const minHeight = Math.max(requestedMinHeight ?? 0, MIN_IMAGE_HEIGHT);

      deps.logger.log(`Serper.dev Image Search for "${query}" min ${minWidth}x${minHeight}`);
      const num = Math.min(reqCount ?? cfg.images.results, cfg.images.results);
      const body: Record<string, unknown> = { q: query, num };
      // Images are language-agnostic: only bias toward a locale when the user
      // explicitly requested a specific language via `lang`. Never fall back
      // to the UI language automatically.
      applyLocaleParams(body, lang);
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
        deps.logger.warn(`Serper.dev Image Search returned ${res.status} for "${query}"`);
        return { results: [] };
      }
      const data = (await res.json()) as SerperImageSearchResponse;
      if (!data.images?.length) {
        deps.logger.warn(`Serper.dev Image Search returned 0 results for "${query}"`);
        return { results: [] };
      }
      const results = data.images.map(mapSerperImageResult).filter((r) => {
        if (!isTrustedImageUrl(r.imageUrl)) return false;
        const w = r.width ?? 0;
        const h = r.height ?? 0;
        if (!w || !h) return true;
        return meetsMinimumImageDimensions(w, h, minWidth, minHeight);
      });
      deps.logger.log(`Serper.dev Image Search returned ${results.length} results for "${query}"`);
      return { results };
    },
  });
}
