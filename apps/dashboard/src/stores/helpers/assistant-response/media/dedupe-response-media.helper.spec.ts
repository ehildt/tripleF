import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { dedupeResponseMedia } from './dedupe-response-media.helper';

describe('dedupeResponseMedia', () => {
  it('drops a gallery image that reuses the rendered hero image', () => {
    const data: AssistantResponseData = {
      heroImageUrl: '/storage/hero.jpg',
      galleryItems: [
        { imageUrl: '/storage/hero.jpg' },
        { imageUrl: '/storage/other.jpg' },
      ],
    };
    dedupeResponseMedia(data);
    expect(data.galleryItems?.map((i) => i.imageUrl)).toEqual([
      '/storage/other.jpg',
    ]);
  });

  it('keeps the hero image spendable when a hero video renders instead', () => {
    const data: AssistantResponseData = {
      heroImageUrl: '/storage/hero.jpg',
      heroVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      heroVideoTitle: 'A video',
      galleryItems: [{ imageUrl: '/storage/hero.jpg' }],
    };
    dedupeResponseMedia(data);
    expect(data.galleryItems).toHaveLength(1);
  });

  it('drops duplicate gallery images', () => {
    const data: AssistantResponseData = {
      galleryItems: [{ imageUrl: '/a.jpg' }, { imageUrl: '/a.jpg' }],
    };
    dedupeResponseMedia(data);
    expect(data.galleryItems).toHaveLength(1);
  });

  it('collapses video URL variants in the video gallery', () => {
    const data: AssistantResponseData = {
      videoGalleryItems: [
        { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { videoUrl: 'https://youtu.be/dQw4w9WgXcQ' },
      ],
    };
    dedupeResponseMedia(data);
    expect(data.videoGalleryItems).toHaveLength(1);
  });

  it('drops a related story that reuses a source URL and blanks a reused thumbnail', () => {
    const data: AssistantResponseData = {
      heroImageUrl: '/hero.jpg',
      sources: [{ url: 'https://example.com/a' }],
      relatedStories: [
        { title: 'dup source', url: 'https://example.com/a' },
        {
          title: 'reused image',
          url: 'https://example.com/b',
          imageUrl: '/hero.jpg',
        },
        {
          title: 'fresh',
          url: 'https://example.com/c',
          imageUrl: '/fresh.jpg',
        },
      ],
    };
    dedupeResponseMedia(data);
    expect(data.relatedStories?.map((s) => s.title)).toEqual([
      'reused image',
      'fresh',
    ]);
    expect(data.relatedStories?.[0].imageUrl).toBe('');
  });

  it('drops a card that reuses a source URL', () => {
    const data: AssistantResponseData = {
      sources: [{ url: 'https://example.com/a' }],
      cards: [{ title: 'dup', url: 'https://example.com/a' }],
    };
    dedupeResponseMedia(data);
    expect(data.cards).toHaveLength(0);
  });
});
