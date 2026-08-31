import type { SerperPlacesSearchResponse } from '../places-search.types.js';

type SerperPlaceItem = NonNullable<SerperPlacesSearchResponse['places']>[number];

/** Normalize a Serper place item into the places-search result shape. */
export function mapSerperPlaceResult(r: SerperPlaceItem) {
  return {
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
  };
}
