import { describe, expect, it } from 'vitest';

import { mapPageImage } from './map-page-image.helper.js';

describe('mapPageImage', () => {
  it('builds a page image entry', () => {
    expect(mapPageImage('h1', 2, 'doc.pdf')).toEqual({
      name: 'doc.pdf · page 3',
      hash: 'h1',
      page: 3,
    });
  });
});
