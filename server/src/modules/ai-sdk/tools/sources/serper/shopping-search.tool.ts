import { tool } from 'ai';
import { z } from 'zod';

import { applyLocaleParams } from '../apply-locale-params.helper.js';
import { fetchWithTimeout } from '../fetch-with-timeout.js';
import { SEARCH_TIMEOUT_MS } from '../search-timeout.js';
import { resolveSerperShopOfferLinks } from '../serper-shop-links.js';
import type { ToolDependencies } from '../types.js';

import { HEADERS } from './serper.constants.js';

export function createSerperShoppingSearch(deps: ToolDependencies) {
  return tool({
    description:
      'Search for products using Serper.dev (Google Shopping). Returns prices, sellers, delivery info, images, and per-offer ratings. Phrase the query as the bare product name with model number (e.g. "Sony WH-1000XM5") — do NOT add words like "review", "test", or long descriptive sentences, they hurt shopping result quality.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'The exact product name with model number, kept short and standalone — resolve product references from the conversation (e.g. "the headphones we discussed" becomes "Sony WH-1000XM5"). No extra words like "buy", "price", or "review".',
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
      if (!cfg.enabled || !cfg.apiKey || !cfg.shopping.enabled) {
        return {
          results: [],
          error: 'Serper.dev shopping is not enabled',
        };
      }

      deps.logger.log(`Serper.dev Shopping search for "${query}"`);
      const num = Math.min(
        reqCount ?? cfg.shopping.results,
        cfg.shopping.results,
      );
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
      const data = (await res.json()) as {
        shopping?: Array<{
          title: string;
          link: string;
          price: string;
          source: string;
          imageUrl?: string;
          delivery?: string;
          rating?: number;
          ratingCount?: number;
        }>;
      };
      if (!data.shopping?.length) {
        deps.logger.warn(
          `Serper.dev Shopping returned 0 results for "${query}"`,
        );
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
