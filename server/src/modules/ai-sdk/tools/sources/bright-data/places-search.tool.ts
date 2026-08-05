import { tool } from 'ai';
import { z } from 'zod';

import { applyLocaleParams } from '../apply-locale-params.helper.js';
import { requestBrightData } from '../bright-data-client.js';
import { BRIGHT_DATA_TIMEOUT_MS } from '../search-timeout.js';
import type { ToolDependencies } from '../types.js';

import { buildGoogleUrl, engineEnabled } from './bright-data.constants.js';

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
