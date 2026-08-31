import { describe, expect, it } from 'vitest';

import { mapSerperPlaceResult } from './map-serper-place-result.helper.js';

describe('mapSerperPlaceResult', () => {
  it('maps a place item to the places-search result shape', () => {
    expect(
      mapSerperPlaceResult({
        title: 'Cafe',
        address: '1 Main St',
        phoneNumber: '555-1234',
        latitude: 1.5,
        longitude: 2.5,
        rating: 4.2,
        ratingCount: 30,
        type: 'cafe',
        website: 'https://example.com',
        cid: 'cid-1',
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
      cid: 'cid-1',
    });
  });

  it('falls back to empty strings for optional fields', () => {
    expect(
      mapSerperPlaceResult({
        title: 'Cafe',
        address: '',
      }),
    ).toEqual({
      title: 'Cafe',
      address: '',
      phoneNumber: '',
      latitude: undefined,
      longitude: undefined,
      rating: undefined,
      ratingCount: undefined,
      type: '',
      website: '',
      cid: '',
    });
  });
});
