import { describe, expect, it } from 'vitest';

import { mapSessionImage } from './map-session-image.helper.js';

describe('mapSessionImage', () => {
  it('projects a session image, dropping the source field', () => {
    expect(
      mapSessionImage({ name: 'img.png', hash: 'h1', source: 'cloud' }),
    ).toEqual({ name: 'img.png', hash: 'h1' });
  });
});
