import type { BrightDataPlacesSearchResponse } from '../places-search.types.js';

type BrightDataPlaceItem = NonNullable<
  BrightDataPlacesSearchResponse['local_results'] | BrightDataPlacesSearchResponse['places']
>[number];

/** Normalize a Bright Data place item into the places-search result shape. */
export function mapBrightDataPlaceResult(r: BrightDataPlaceItem) {
  return {
    title: r.title || '',
    address: r.address || '',
    phoneNumber: r.phone || '',
    latitude: r.latitude,
    longitude: r.longitude,
    rating: r.rating,
    ratingCount: r.reviews_cnt,
    type: r.type || '',
    website: r.website || '',
  };
}
