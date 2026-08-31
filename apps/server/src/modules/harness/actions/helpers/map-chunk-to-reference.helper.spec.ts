import { describe, expect, it } from 'vitest';

import { mapChunkToReference } from './map-chunk-to-reference.helper.js';

describe('mapChunkToReference', () => {
  it('projects a chunk into the reference shape', () => {
    expect(
      mapChunkToReference({
        url: 'https://example.com',
        title: 'T',
        content: 'Body',
      }),
    ).toEqual({ url: 'https://example.com', title: 'T', content: 'Body' });
  });
});
