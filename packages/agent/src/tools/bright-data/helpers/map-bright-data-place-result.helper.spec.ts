import { describe, expect, it } from 'vitest';

import { mapBrightDataPlaceResult } from './map-bright-data-place-result.helper.js';

describe('mapBrightDataPlaceResult', () => {
  it('maps a place item to the places-search result shape', () => {
    expect(
      mapBrightDataPlaceResult({
        title: 'Cafe',
        address: '1 Main St',
        phone: '555-1234',
        latitude: 1.5,
        longitude: 2.5,
        rating: 4.2,
        reviews_cnt: 30,
        type: 'cafe',
        website: 'https://example.com',
      }),
    ).toEqual({
      title: 'Cafe',
      address: '1 Main St',
      phoneNumber: '555-1234',
      latitude: 1.5,
      longitude: 2.5,
      rating: 4.2,
      ratingCount: 30,
      type: 'cafe',
      website: 'https://example.com',
    });
  });

  it('falls back to empty strings for optional fields', () => {
    expect(mapBrightDataPlaceResult({})).toEqual({
      title: '',
      address: '',
      phoneNumber: '',
      latitude: undefined,
      longitude: undefined,
      rating: undefined,
      ratingCount: undefined,
      type: '',
      website: '',
    });
  });
});
