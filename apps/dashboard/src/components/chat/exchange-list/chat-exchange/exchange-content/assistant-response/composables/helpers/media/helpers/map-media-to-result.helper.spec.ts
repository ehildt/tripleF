import { describe, expect, it } from 'vitest';

import { mapMediaToResult } from './map-media-to-result.helper';

describe('mapMediaToResult', () => {
  it('projects a media item into the result shape', () => {
    expect(mapMediaToResult({ url: 'https://x/a.png', title: 'A' })).toEqual({
      url: 'https://x/a.png',
      title: 'A',
    });
    expect(mapMediaToResult({ url: 'https://x/b.png' })).toEqual({
      url: 'https://x/b.png',
      title: '',
    });
  });
});
