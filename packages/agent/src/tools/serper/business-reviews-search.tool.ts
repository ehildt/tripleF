import { type Tool, tool } from 'ai';

import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { fetchWithTimeout } from '../helpers/fetch-with-timeout.js';
import type { ToolDependencies } from '../types/types.js';

import {
  type SerperBusinessReviewsSearchInput,
  serperBusinessReviewsSearchSchema,
} from './business-reviews-search.schema.js';
import type { SerperBusinessReviewsSearchResponse } from './business-reviews-search.types.js';
import { HEADERS } from './serper.constants.js';

export function createSerperBusinessReviewsSearch(deps: ToolDependencies): Tool {
  return tool({
    description: `Fetch Google Maps reviews for a specific business or place using Serper.dev. 
      Returns individual reviewer snippets with author names, star ratings, dates, and likes. 
      This endpoint reviews BUSINESSES (shops, restaurants, hotels, services) — it does not search editorial product reviews. 
      Identify the business by its exact name plus location via query (e.g. "MediaMarkt Berlin Alexanderplatz"), 
      or pass placeId/cid when a previous places search returned them. 
      Use it to judge seller/business reputation; for product quality opinions use a *WebSearch tool with a "<product> review" query instead.`,
    inputSchema: serperBusinessReviewsSearchSchema,
    execute: async ({ query, placeId, cid, lang }: SerperBusinessReviewsSearchInput) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.reviews.enabled) {
        return {
          results: [],
          error: 'Serper.dev reviews is not enabled',
        };
      }
      if (!placeId && !cid && !query?.trim()) {
        return {
          results: [],
          error: 'Provide a placeId, cid, or business name query',
        };
      }

      const lookup = placeId ?? cid ?? query?.trim();
      deps.logger.log(`Serper.dev Reviews search for "${lookup}"`);
      const body: Record<string, unknown> = {};
      if (placeId) body.placeId = placeId;
      else if (cid) body.cid = cid;
      else body.q = query!.trim();
      applyLocaleParams(body, lang ?? deps.defaultLang);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/reviews',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify(body),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [], error: `HTTP ${res.status}` };
      const data = (await res.json()) as SerperBusinessReviewsSearchResponse;
      if (!data.reviews?.length) {
        deps.logger.warn(`Serper.dev Reviews returned 0 results for "${lookup}"`);
        return { results: [] };
      }
      const placeName = data.placeInfo?.title || '';
      const results = data.reviews.map((r) => ({
        author: r.user?.name || '',
        snippet: r.snippet || '',
        rating: r.rating,
        date: r.isoDate || r.date || '',
        likes: r.likes ?? 0,
        place: placeName,
      }));
      return {
        results,
        place: data.placeInfo
          ? {
              title: data.placeInfo.title || '',
              address: data.placeInfo.address || '',
              rating: data.placeInfo.rating,
              ratingCount: data.placeInfo.ratingCount,
            }
          : undefined,
      };
    },
  });
}
