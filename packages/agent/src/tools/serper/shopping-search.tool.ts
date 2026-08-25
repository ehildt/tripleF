import { type Tool, tool } from 'ai';

import { SEARCH_TIMEOUT_MS } from '../constants/search-timeout.js';
import { applyLocaleParams } from '../helpers/apply-locale-params.helper.js';
import { fetchWithTimeout } from '../helpers/fetch-with-timeout.js';
import { resolveSerperShopOfferLinks } from '../helpers/serper-shop-links.js';
import type { ToolDependencies } from '../types/types.js';

import { HEADERS } from './serper.constants.js';
import { type SerperShoppingSearchInput, serperShoppingSearchSchema } from './shopping-search.schema.js';
import type { SerperShoppingSearchResponse } from './shopping-search.types.js';

export function createSerperShoppingSearch(deps: ToolDependencies): Tool {
  return tool({
    description:
      'Search for products using Serper.dev (Google Shopping). Returns prices, sellers, delivery info, images, and per-offer ratings. Phrase the query as the bare product name with model number (e.g. "Sony WH-1000XM5") — do NOT add words like "review", "test", or long descriptive sentences, they hurt shopping result quality.',
    inputSchema: serperShoppingSearchSchema,
    execute: async ({ query, count: reqCount, lang }: SerperShoppingSearchInput) => {
      const cfg = deps.getLiveConfig().serper;
      if (!cfg.enabled || !cfg.apiKey || !cfg.shopping.enabled) {
        return {
          results: [],
          error: 'Serper.dev shopping is not enabled',
        };
      }

      deps.logger.log(`Serper.dev Shopping search for "${query}"`);
      const num = Math.min(reqCount ?? cfg.shopping.results, cfg.shopping.results);
      const body: Record<string, unknown> = { q: query, num };
      const effectiveLang = lang ?? deps.defaultLang;
      applyLocaleParams(body, effectiveLang);
      const res = await fetchWithTimeout(
        'https://google.serper.dev/shopping',
        {
          method: 'POST',
          headers: HEADERS(cfg.apiKey),
          body: JSON.stringify(body),
        },
        { timeoutMs: SEARCH_TIMEOUT_MS },
      );
      if (!res.ok) return { results: [], error: `HTTP ${res.status}` };
      const data = (await res.json()) as SerperShoppingSearchResponse;
      if (!data.shopping?.length) {
        deps.logger.warn(`Serper.dev Shopping returned 0 results for "${query}"`);
        return { results: [] };
      }
      // NOTE: no liveness HEAD checks here. Serper returns Google shopping
      // redirect links that routinely block HEAD requests — probing them with
      // a short timeout drops every offer. Google-hosted links are resolved
      // to merchant URLs below (resolveSerperShopOfferLinks); link validity
      // is enforced later by the product schema's safeUrl validation.
      const results = data.shopping.map((r) => ({
        title: r.title,
        price: r.price || '',
        link: r.link || '',
        source: r.source || '',
        imageUrl: r.imageUrl || '',
        delivery: r.delivery || '',
        rating: r.rating,
        ratingCount: r.ratingCount,
      }));
      return {
        results: await resolveSerperShopOfferLinks(results, {
          apiKey: cfg.apiKey,
          lang: effectiveLang,
          logger: deps.logger,
        }),
      };
    },
  });
}
