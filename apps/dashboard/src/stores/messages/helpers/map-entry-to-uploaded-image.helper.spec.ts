import { describe, expect, it } from 'vitest';

import { mapEntryToUploadedImage } from './map-entry-to-uploaded-image.helper';

describe('mapEntryToUploadedImage', () => {
  it('normalizes a cloud entry', () => {
    const result = mapEntryToUploadedImage(
      { name: 'img.png', hash: 'h1', size: 10, source: 'cloud' },
      'c1',
    );
    expect(result).toMatchObject({
      name: 'img.png',
      hash: 'h1',
      size: 10,
      selected: true,
      conversationId: 'c1',
      source: 'cloud',
    });
  });

  it('defaults a non-cloud entry to local', () => {
    expect(
      mapEntryToUploadedImage({ name: 'img.png', hash: 'h1' }, 'c1').source,
    ).toBe('local');
  });
});
