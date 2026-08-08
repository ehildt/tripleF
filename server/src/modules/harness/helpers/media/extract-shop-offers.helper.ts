import type {
  ExtractedShopOffer,
  RawShopOffer,
} from './extract-shop-offers.types.js';
import type { ToolEntry } from './tool-entry.types.js';

const MAX_SHOP_OFFERS = 12;

function readResults(result: unknown): RawShopOffer[] {
  const results = (result as { results?: RawShopOffer[] } | undefined)?.results;
  return Array.isArray(results) ? results : [];
}

function toShopOffer(raw: RawShopOffer): ExtractedShopOffer {
  return {
    title: raw.title || '',
    price: raw.price || '',
    source: raw.source || '',
    link: raw.link!,
    ...(raw.delivery ? { delivery: raw.delivery } : {}),
    ...(typeof raw.rating === 'number' ? { rating: raw.rating } : {}),
    ...(typeof raw.ratingCount === 'number'
      ? { ratingCount: raw.ratingCount }
      : {}),
  };
}

/**
 * Extract shop offers from *ShoppingSearch tool results as compact,
 * labeled records for the respond step's tool context. Keeps only the
 * fields the product template needs so the context stays small and the
 * model cannot miss the prices (image URLs are Google thumbnail proxies
 * and are intentionally dropped).
 */
export function extractShopOffers(
  toolResults: ToolEntry[],
): ExtractedShopOffer[] {
  const seen = new Set<string>();

  return toolResults
    .filter((tr) => tr.toolName.endsWith('ShoppingSearch'))
    .flatMap((tr) => readResults(tr.result))
    .filter((raw) => {
      if (!raw.link || seen.has(raw.link)) return false;
      seen.add(raw.link);
      return true;
    })
    .slice(0, MAX_SHOP_OFFERS)
    .map(toShopOffer);
}
