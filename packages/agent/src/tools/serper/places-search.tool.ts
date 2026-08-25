import { type Tool, tool } from 'ai';

import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { fetchWithTimeout } from '../helpers/fetch-with-timeout.js';
import type { ToolDependencies } from '../types/types.js';

import { type SerperPlacesSearchInput, serperPlacesSearchSchema } from './places-search.schema.js';
import type { SerperPlacesSearchResponse } from './places-search.types.js';
import { HEADERS } from './serper.constants.js';

export function createSerperPlacesSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search for places and businesses using Serper.dev (Google Maps). Returns addresses, phone numbers, ratings, review counts, and coordinates. Phrase the query like a Google Maps search: a business name, a business type, or a business type plus location (e.g. "MediaMarkt Berlin", "coffee shops in Munich").',
    inputSchema: serperPlacesSearchSchema,
    execute: async ({ query, count: reqCount, lang }: SerperPlacesSearchInput) => {
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
      const data = (await res.json()) as SerperPlacesSearchResponse;
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
