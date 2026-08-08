import { describe, expect, it } from 'vitest';

import { dedupeGalleryItems } from './dedupe-gallery-items.helper.js';

describe('dedupeGalleryItems', () => {
  it('removes duplicate urls', () => {
    const items = [
      { imageUrl: '/storage/a', imageAlt: 'a', title: 'A', caption: 'A' },
      { imageUrl: '/storage/a', imageAlt: 'a2', title: 'A2', caption: 'A2' },
    ];
    expect(dedupeGalleryItems(items)).toEqual([
      { imageUrl: '/storage/a', imageAlt: 'a', title: 'A', caption: 'A' },
    ]);
  });

  it('removes items with the same storage hash', () => {
    const items = [
      { imageUrl: '/storage/abc123', imageAlt: 'a', title: 'A', caption: 'A' },
      {
        imageUrl: '/storage/abc123?w=100',
        imageAlt: 'b',
        title: 'B',
        caption: 'B',
      },
    ];
    expect(dedupeGalleryItems(items)).toEqual([
      { imageUrl: '/storage/abc123', imageAlt: 'a', title: 'A', caption: 'A' },
    ]);
  });

  it('keeps distinct hashes', () => {
    const items = [
      { imageUrl: '/storage/abc', imageAlt: 'a', title: 'A', caption: 'A' },
      { imageUrl: '/storage/def', imageAlt: 'b', title: 'B', caption: 'B' },
    ];
    expect(dedupeGalleryItems(items)).toEqual(items);
  });

  it('drops items without a url', () => {
    const items = [{ imageUrl: '', imageAlt: 'a', title: 'A', caption: 'A' }];
    expect(dedupeGalleryItems(items)).toEqual([]);
  });
});
