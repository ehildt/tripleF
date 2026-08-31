import { describe, expect, it, vi } from 'vitest';

import { mapPresentationToggle } from './map-presentation-toggle.helper';

describe('mapPresentationToggle', () => {
  const t = vi.fn((key: string) => key);

  it('builds a gallery presentation toggle', () => {
    expect(
      mapPresentationToggle(
        { key: 'gallery', media: 'image', icon: {} as never },
        { image: 'gallery', video: 'list' },
        {
          image: { toGallery: 'toGallery', toList: 'toList' },
          video: { toGallery: 'toGallery', toList: 'toList' },
        },
        t,
      ),
    ).toEqual({
      key: 'gallery',
      media: 'image',
      icon: {},
      presentation: 'gallery',
      title: 'toList',
    });
  });
});
