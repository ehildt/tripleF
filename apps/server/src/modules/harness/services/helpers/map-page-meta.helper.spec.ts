import { describe, expect, it } from 'vitest';

import { mapPageMeta } from './map-page-meta.helper.js';

describe('mapPageMeta', () => {
  it('builds the upload meta for a rendered page', () => {
    expect(
      mapPageMeta(
        { buffer: Buffer.from('abc'), hash: 'h1', page: 2 },
        'doc.pdf',
      ),
    ).toEqual({
      name: 'doc.pdf · page 2',
      type: 'image/jpeg',
      hash: 'h1',
      size: 3,
    });
  });
});
