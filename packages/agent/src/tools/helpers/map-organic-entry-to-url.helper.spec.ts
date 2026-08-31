import { describe, expect, it } from 'vitest';

import { mapOrganicEntryToUrl } from './map-organic-entry-to-url.helper.js';

describe('mapOrganicEntryToUrl', () => {
  it('maps an organic entry to its url', () => {
    expect(mapOrganicEntryToUrl({ link: 'https://example.com' })).toEqual({
      url: 'https://example.com',
    });
  });

  it('maps a missing link to undefined', () => {
    expect(mapOrganicEntryToUrl({})).toEqual({ url: undefined });
  });
});
