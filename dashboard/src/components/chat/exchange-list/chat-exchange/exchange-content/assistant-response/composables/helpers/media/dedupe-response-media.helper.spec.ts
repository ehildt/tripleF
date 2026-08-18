import { describe, expect, it } from 'vitest';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { dedupeResponseMedia } from './dedupe-response-media.helper';

function image(url: string) {
  return { imageUrl: url, imageAlt: url, title: url };
}

function video(url: string) {
  return { videoUrl: url, title: url };
}

describe('dedupeResponseMedia', () => {
  it('removes the hero image from the gallery when there is no hero video', () => {
    const data: HarnessResponseData = {
      title: 'T',
      heroImageUrl: 'https://example.com/hero.jpg',
      galleryItems: [
        image('https://example.com/hero.jpg'),
        image('https://example.com/a.jpg'),
      ],
    };

    dedupeResponseMedia(data);

    expect(data.galleryItems?.map((item) => item.imageUrl)).toEqual([
      'https://example.com/a.jpg',
    ]);
  });

  it('keeps the hero image in the gallery when a hero video renders instead', () => {
    const data: HarnessResponseData = {
      title: 'T',
      heroImageUrl: 'https://example.com/hero.jpg',
      heroVideoUrl: 'https://www.youtube.com/watch?v=abc123',
      galleryItems: [
        image('https://example.com/hero.jpg'),
        image('https://example.com/a.jpg'),
      ],
    };

    dedupeResponseMedia(data);

    expect(data.galleryItems?.map((item) => item.imageUrl)).toEqual([
      'https://example.com/hero.jpg',
      'https://example.com/a.jpg',
    ]);
  });

  it('drops duplicate image URLs inside the gallery', () => {
    const data: HarnessResponseData = {
      title: 'T',
      galleryItems: [
        image('https://example.com/a.jpg'),
        image('https://example.com/a.jpg'),
        image('https://example.com/b.jpg'),
      ],
    };

    dedupeResponseMedia(data);

    expect(data.galleryItems).toHaveLength(2);
  });

  it('leaves an empty gallery when everything was spent on the hero', () => {
    const data: HarnessResponseData = {
      title: 'T',
      heroImageUrl: 'https://example.com/hero.jpg',
      galleryItems: [image('https://example.com/hero.jpg')],
    };

    dedupeResponseMedia(data);

    expect(data.galleryItems).toEqual([]);
  });

  it('removes the hero video from the video gallery across YouTube URL variants', () => {
    const data: HarnessResponseData = {
      title: 'T',
      heroVideoUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa',
      videoGalleryItems: [
        video('https://youtu.be/aaaaaaaaaaa'),
        video('https://www.youtube.com/watch?v=bbbbbbbbbbb'),
      ],
    };

    dedupeResponseMedia(data);

    expect(data.videoGalleryItems?.map((item) => item.videoUrl)).toEqual([
      'https://www.youtube.com/watch?v=bbbbbbbbbbb',
    ]);
  });

  it('spends per-topic hero media against the merged galleries', () => {
    const data: HarnessResponseData = {
      title: 'T',
      bodySections: [
        {
          topic: 'A',
          heroImageUrl: 'https://example.com/topic-a.jpg',
        },
        {
          topic: 'B',
          heroImageUrl: 'https://example.com/topic-b.jpg',
          heroVideoUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa',
        },
      ],
      galleryItems: [
        image('https://example.com/topic-a.jpg'),
        image('https://example.com/topic-b.jpg'),
        image('https://example.com/fresh.jpg'),
      ],
      videoGalleryItems: [
        video('https://youtu.be/aaaaaaaaaaa'),
        video('https://www.youtube.com/watch?v=bbbbbbbbbbb'),
      ],
    };

    dedupeResponseMedia(data);

    // Topic A's hero image is spent (image hero, no video). Topic B has a
    // video hero, so its image is NOT spent — it stays gallery content;
    // its video is spent against the video gallery.
    expect(data.galleryItems?.map((item) => item.imageUrl)).toEqual([
      'https://example.com/topic-b.jpg',
      'https://example.com/fresh.jpg',
    ]);
    expect(data.videoGalleryItems?.map((item) => item.videoUrl)).toEqual([
      'https://www.youtube.com/watch?v=bbbbbbbbbbb',
    ]);
  });

  it('drops duplicate videos inside the video gallery', () => {
    const data: HarnessResponseData = {
      title: 'T',
      videoGalleryItems: [
        video('https://www.youtube.com/watch?v=aaaaaaaaaaa'),
        video('https://youtube.com/shorts/aaaaaaaaaaa'),
        video('https://vimeo.com/42'),
      ],
    };

    dedupeResponseMedia(data);

    expect(data.videoGalleryItems?.map((item) => item.videoUrl)).toEqual([
      'https://www.youtube.com/watch?v=aaaaaaaaaaa',
      'https://vimeo.com/42',
    ]);
  });

  it('drops related stories that reuse source URLs or each other', () => {
    const data: HarnessResponseData = {
      title: 'T',
      sources: [{ title: 'Source', url: 'https://a.com/article' }],
      relatedStories: [
        { title: 'Repeat', url: 'https://a.com/article' },
        { title: 'Fresh', url: 'https://b.com/other' },
        { title: 'Also fresh but same URL', url: 'https://b.com/other' },
      ],
    };

    dedupeResponseMedia(data);

    expect(data.relatedStories?.map((story) => story.title)).toEqual(['Fresh']);
  });

  it('blanks related-story thumbnails that reuse hero or gallery imagery', () => {
    const data: HarnessResponseData = {
      title: 'T',
      heroImageUrl: 'https://example.com/hero.jpg',
      galleryItems: [image('https://example.com/a.jpg')],
      relatedStories: [
        {
          title: 'Dupes',
          url: 'https://b.com/one',
          imageUrl: 'https://example.com/a.jpg',
        },
        {
          title: 'Dupes too',
          url: 'https://b.com/two',
          imageUrl: 'https://example.com/hero.jpg',
        },
        {
          title: 'Fine',
          url: 'https://b.com/three',
          imageUrl: 'https://example.com/fresh.jpg',
        },
      ],
    };

    dedupeResponseMedia(data);

    expect(data.relatedStories?.map((story) => story.imageUrl)).toEqual([
      '',
      '',
      'https://example.com/fresh.jpg',
    ]);
  });

  it('blanks thumbnails duplicated between two related stories', () => {
    const data: HarnessResponseData = {
      title: 'T',
      relatedStories: [
        {
          title: 'First',
          url: 'https://a.com/1',
          imageUrl: 'https://example.com/x.jpg',
        },
        {
          title: 'Second',
          url: 'https://a.com/2',
          imageUrl: 'https://example.com/x.jpg',
        },
      ],
    };

    dedupeResponseMedia(data);

    expect(data.relatedStories?.[0].imageUrl).toBe('https://example.com/x.jpg');
    expect(data.relatedStories?.[1].imageUrl).toBe('');
  });

  it('drops cards that reuse source URLs or each other', () => {
    const data: HarnessResponseData = {
      title: 'T',
      sources: [{ title: 'Source', url: 'https://a.com/article' }],
      cards: [
        { title: 'Repeat', url: 'https://a.com/article', linkLabel: 'Read' },
        { title: 'Fresh', url: 'https://b.com/other', linkLabel: 'Read' },
        { title: 'Same URL', url: 'https://b.com/other', linkLabel: 'Read' },
      ],
    };

    dedupeResponseMedia(data);

    expect(data.cards?.map((card) => card.title)).toEqual(['Fresh']);
  });

  it('keeps entries without URLs untouched', () => {
    const data: HarnessResponseData = {
      title: 'T',
      relatedStories: [{ title: 'No URL' }],
      cards: [{ title: 'No URL' }],
    };

    dedupeResponseMedia(data);

    expect(data.relatedStories).toHaveLength(1);
    expect(data.cards).toHaveLength(1);
  });
});
