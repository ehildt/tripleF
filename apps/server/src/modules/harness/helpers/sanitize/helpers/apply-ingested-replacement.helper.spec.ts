import { describe, expect, it } from 'vitest';

import { applyIngestedReplacement } from './apply-ingested-replacement.helper.js';

describe('applyIngestedReplacement', () => {
  it('replaces the image url with the ingested replacement', () => {
    expect(
      applyIngestedReplacement(
        { imageUrl: 'https://external.com/img.jpg', title: 'Old' },
        {
          imageUrl: 'https://local.com/img.jpg',
          title: 'New',
          width: 100,
          height: 50,
        },
      ),
    ).toEqual({
      imageUrl: 'https://local.com/img.jpg',
      title: 'New',
      width: 100,
      height: 50,
    });
  });

  it('returns the item unchanged when there is no replacement', () => {
    const item = { imageUrl: 'https://external.com/img.jpg' };
    expect(applyIngestedReplacement(item, undefined)).toBe(item);
  });
});
