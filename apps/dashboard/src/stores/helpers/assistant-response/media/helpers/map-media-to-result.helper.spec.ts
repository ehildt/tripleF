import { describe, expect, it } from 'vitest';

import { mapMediaToResult } from './map-media-to-result.helper';

describe('mapMediaToResult', () => {
  it('keeps the url and title', () => {
    expect(mapMediaToResult({ url: '/a.jpg', title: 'Pic' })).toEqual({
      url: '/a.jpg',
      title: 'Pic',
    });
  });

  it('defaults a missing title to an empty string', () => {
    expect(mapMediaToResult({ url: '/a.jpg' })).toEqual({
      url: '/a.jpg',
      title: '',
    });
  });
});
