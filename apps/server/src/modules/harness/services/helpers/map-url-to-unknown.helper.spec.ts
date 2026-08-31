import { describe, expect, it } from 'vitest';

import { mapUrlToUnknown } from './map-url-to-unknown.helper.js';

describe('mapUrlToUnknown', () => {
  it('marks a url as unvalidated', () => {
    expect(mapUrlToUnknown('https://example.com/img.jpg')).toEqual({
      url: 'https://example.com/img.jpg',
      kind: 'unknown',
    });
  });
});
