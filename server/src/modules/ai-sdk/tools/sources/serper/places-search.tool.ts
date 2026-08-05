import { tool } from 'ai';
import { z } from 'zod';

import { applyLocaleParams } from '../apply-locale-params.helper.js';
import { fetchWithTimeout } from '../fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from '../search-timeout.js';
import type { ToolDependencies } from '../types.js';

import { HEADERS } from './serper.constants.js';

export function createSerperPlacesSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for places and businesses using Serper.dev (Google Maps). Returns addresses, phone numbers, ratings, review counts, and coordinates. Phrase the query like a Google Maps search: a business name, a business type, or a business type plus location (e.g. "MediaMarkt Berlin", "coffee shops in Munich").',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'A standalone places search query that explicitly names the business or business type plus location (e.g. "MediaMarkt Berlin", "coffee shops in Munich") — resolve the subject from the conversation; never copy the user message verbatim.',
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
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.places.enabled) {
        return { results: [], error: 'Serper.dev places is not enabled' };
      }

      deps.logger.log(`Serper.dev Places search for "${query}"`);
      const num = Math.min(reqCount ?? cfg.places.results, cfg.places.results);
      const body: Record<string, unknown> = { q: query, num };
      applyLocaleParams(body, lang ?? deps.defaultLang);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/places',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify(body),
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
          type?: string;
          website?: string;
          cid?: string;
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
        type: r.type || '',
        website: r.website || '',
        cid: r.cid || '',
      }));
      return { results };
    },
  });
}
