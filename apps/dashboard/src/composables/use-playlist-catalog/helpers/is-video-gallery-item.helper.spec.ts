import { describe, expect, it } from 'vitest';

import { isVideoGalleryItem } from './is-video-gallery-item.helper';

describe('isVideoGalleryItem', () => {
  it('accepts required and optional playlist video fields', () => {
    expect(
      isVideoGalleryItem({
        videoUrl: 'https://video.test/one',
        title: 'One',
        caption: 'Caption',
        duration: '1:00',
        channel: 'Channel',
        date: '2026-01-01',
        views: 10,
        thumbnailUrl: 'https://video.test/thumb.jpg',
        description: 'Description',
      }),
    ).toBe(true);
  });

  it('rejects non-records and missing or malformed fields', () => {
    expect(isVideoGalleryItem(null)).toBe(false);
    expect(isVideoGalleryItem([])).toBe(false);
    expect(isVideoGalleryItem({ title: 'Missing URL' })).toBe(false);
    expect(isVideoGalleryItem({ videoUrl: 10 })).toBe(false);
    expect(
      isVideoGalleryItem({ videoUrl: 'https://video.test/one', views: '10' }),
    ).toBe(false);
    expect(
      isVideoGalleryItem({ videoUrl: 'https://video.test/one', title: null }),
    ).toBe(false);
  });
});
