import { describe, expect, it } from 'vitest';

import { imagelistToText } from './imagelist-to-text.helper';

describe('imagelistToText', () => {
  it('lists previously shown images with parenthesized urls', () => {
    const result = imagelistToText({
      category: 'Wallpapers',
      title: 'Gothic remake wallpapers',
      subtitle: '1440p collection',
      galleryItems: [
        {
          imageUrl: 'https://example.com/a.jpg',
          title: 'Castle',
          imageAlt: 'A castle',
        },
        { imageUrl: 'https://example.com/b.jpg' },
        { title: 'no url' } as never,
      ],
    });

    expect(result).toContain('Category: Wallpapers');
    expect(result).toContain('Title: Gothic remake wallpapers');
    expect(result).toContain('Subtitle: 1440p collection');
    expect(result).toContain('Previously shown images:');
    expect(result).toContain('- Castle (https://example.com/a.jpg)');
    expect(result).toContain('- image (https://example.com/b.jpg)');
    expect(result).not.toContain('no url');
  });

  it('returns empty string for empty data', () => {
    expect(imagelistToText({})).toBe('');
  });
});
