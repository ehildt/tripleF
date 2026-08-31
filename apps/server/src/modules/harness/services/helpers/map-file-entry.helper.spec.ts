import { describe, expect, it } from 'vitest';

import { mapFileEntry } from './map-file-entry.helper.js';

describe('mapFileEntry', () => {
  it('projects a file meta entry into the file shape', () => {
    expect(
      mapFileEntry({ name: 'img.png', hash: 'h1' }, 'https://example.com/h1'),
    ).toEqual({ name: 'img.png', url: 'https://example.com/h1' });
  });
});
