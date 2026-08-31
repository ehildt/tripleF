import { describe, expect, it } from 'vitest';

import { mapShownMediaKey } from './map-shown-media-key.helper.js';

describe('mapShownMediaKey', () => {
  it('wraps a media key with its kind', () => {
    expect(mapShownMediaKey('fp:abc', 'Image' as never)).toEqual({
      kind: 'Image',
      mediaKey: 'fp:abc',
    });
  });
});
