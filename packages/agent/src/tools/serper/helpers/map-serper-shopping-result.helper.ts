import type { SerperShoppingSearchResponse } from '../shopping-search.types.js';

type SerperShoppingItem = NonNullable<SerperShoppingSearchResponse['shopping']>[number];

/** Normalize a Serper shopping item into the shopping-search result shape. */
export function mapSerperShoppingResult(r: SerperShoppingItem) {
  return {
    title: r.title,
    price: r.price || '',
    link: r.link || '',
    source: r.source || '',
    imageUrl: r.imageUrl || '',
    delivery: r.delivery || '',
    rating: r.rating,
    ratingCount: r.ratingCount,
  };
}
