import { tool } from 'ai';
import { z } from 'zod';

import { applyLocaleParams } from '../apply-locale-params.helper.js';
import { fetchWithTimeout } from '../fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from '../search-timeout.js';
import type { ToolDependencies } from '../types.js';

import { HEADERS } from './serper.constants.js';

export function createSerperBusinessReviewsSearch(deps: ToolDependencies) {
  return tool({
    description: `Fetch Google Maps reviews for a specific business or place using Serper.dev. 
      Returns individual reviewer snippets with author names, star ratings, dates, and likes. 
      This endpoint reviews BUSINESSES (shops, restaurants, hotels, services) — it does not search editorial product reviews. 
      Identify the business by its exact name plus location via query (e.g. "MediaMarkt Berlin Alexanderplatz"), 
      or pass placeId/cid when a previous places search returned them. 
      Use it to judge seller/business reputation; for product quality opinions use webSearch with a "<product> review" query instead.`,
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe(
          'The exact business or place name, ideally with its location, named explicitly and resolved from the conversation. Used when neither placeId nor cid is known.',
        ),
      placeId: z
        .string()
        .optional()
        .describe(
          'Google Place ID of the business. Most precise identifier — prefer it when available.',
        ),
      cid: z
        .string()
        .optional()
        .describe(
          'Google CID of the business, e.g. from a places search result.',
        ),
      lang: z
        .string()
        .optional()
        .describe(
          'Two-letter ISO language code for result preference (e.g. en, de, ja)',
        ),
    }),
    execute: async ({
      query,
      placeId,
      cid,
      lang,
    }: {
      query?: string;
      placeId?: string;
      cid?: string;
      lang?: string;
    }) => {
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
      const data = (await res.json()) as {
        placeInfo?: {
          title?: string;
          address?: string;
          rating?: number;
          ratingCount?: number;
        };
        reviews?: Array<{
          snippet?: string;
          rating?: number;
          date?: string;
          isoDate?: string;
          likes?: number | null;
          user?: { name?: string };
        }>;
      };
      if (!data.reviews?.length) {
        deps.logger.warn(
          `Serper.dev Reviews returned 0 results for "${lookup}"`,
        );
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
