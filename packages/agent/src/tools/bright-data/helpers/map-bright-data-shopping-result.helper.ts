import type { BrightDataShoppingSearchResponse } from '../shopping-search.types.js';

type BrightDataShoppingItem = NonNullable<BrightDataShoppingSearchResponse['shopping']>[number];

/** Normalize a Bright Data shopping item into the shopping-search result shape. */
export function mapBrightDataShoppingResult(r: BrightDataShoppingItem) {
  return {
    title: r.title || '',
    price: r.price || '',
    link: r.link || '',
    source: r.source || '',
    imageUrl: r.image_url || r.image || '',
    delivery: r.delivery || '',
    rating: r.rating,
    ratingCount: r.rating_count,
  };
}
