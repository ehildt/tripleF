import { describe, expect, it } from 'vitest';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { extractMediaFromToolResults } from './extract-media-from-tool-results.helper';

describe('extractMediaFromToolResults', () => {
  it('does nothing when there are no tool results', () => {
    const data: HarnessResponseData = { title: 'No media' };
    extractMediaFromToolResults([], data);
    expect(data.heroImageUrl).toBeUndefined();
    expect(data.heroVideoUrl).toBeUndefined();
  });

  it('populates hero image and gallery items from image search results', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [
              { imageUrl: 'https://example.com/hero.jpg', title: 'Hero' },
              { imageUrl: 'https://example.com/a.jpg', title: 'A' },
              { imageUrl: 'https://example.com/b.jpg', title: 'B' },
            ],
          },
        },
      ],
      data,
    );

    expect(data.heroImageUrl).toBe('https://example.com/hero.jpg');
    expect(data.galleryItems).toHaveLength(2);
    expect(data.galleryItems?.[0].imageUrl).toBe('https://example.com/a.jpg');
  });

  it('prefers video hero over image hero when both are available', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'serperVideoSearch',
          result: {
            results: [
              { videoUrl: 'https://youtube.com/watch?v=abc', title: 'Trailer' },
            ],
          },
        },
        {
          toolName: 'serperImageSearch',
          result: {
            results: [
              { imageUrl: 'https://example.com/img.jpg', title: 'Img' },
            ],
          },
        },
      ],
      data,
    );

    expect(data.heroVideoUrl).toBe('https://youtube.com/watch?v=abc');
    expect(data.heroImageUrl).toBeUndefined();
  });

  it('names the synthesized hero video from the candidate title only', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'youtubeVideoSearch',
          result: {
            results: [
              { videoUrl: 'https://youtube.com/watch?v=abc', title: 'Trailer' },
            ],
          },
        },
      ],
      data,
    );

    // The popout title bar and now-playing marquee read the hero title; a
    // hero without one must never be synthesized (schema contract). The
    // caption is never fabricated from the title — it stays unset so the
    // figcaption only shows it when a real one exists.
    expect(data.heroVideoTitle).toBe('Trailer');
    expect(data.heroVideoCaption).toBeUndefined();
  });

  it('does not synthesize a hero from a title-less candidate', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'youtubeVideoSearch',
          result: {
            results: [{ videoUrl: 'https://youtube.com/watch?v=abc' }],
          },
        },
      ],
      data,
    );

    expect(data.heroVideoUrl).toBeUndefined();
    // Title-less candidates are contract-incomplete: no gallery either.
    expect(data.videoGalleryItems).toBeUndefined();
  });

  it('populates video gallery items excluding the hero video', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'serperVideoSearch',
          result: {
            results: [
              { videoUrl: 'https://youtube.com/watch?v=hero', title: 'Hero' },
              { videoUrl: 'https://youtube.com/watch?v=a', title: 'A' },
              { videoUrl: 'https://youtube.com/watch?v=b', title: 'B' },
            ],
          },
        },
      ],
      data,
    );

    expect(data.heroVideoUrl).toBe('https://youtube.com/watch?v=hero');
    expect(data.videoGalleryItems).toHaveLength(2);
    expect(data.videoGalleryItems?.[0].videoUrl).toBe(
      'https://youtube.com/watch?v=a',
    );
    // The caption is optional and never synthesized from the title.
    expect(data.videoGalleryItems?.[0].caption).toBeUndefined();
  });

  it('does not duplicate URLs already present in JSON fields', () => {
    const data: HarnessResponseData = {
      heroImageUrl: 'https://example.com/hero.jpg',
      galleryItems: [{ imageUrl: 'https://example.com/a.jpg', title: 'A' }],
    };
    extractMediaFromToolResults(
      [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [
              { imageUrl: 'https://example.com/hero.jpg', title: 'Hero' },
              { imageUrl: 'https://example.com/a.jpg', title: 'A' },
              { imageUrl: 'https://example.com/b.jpg', title: 'B' },
            ],
          },
        },
      ],
      data,
    );

    expect(data.heroImageUrl).toBe('https://example.com/hero.jpg');
    expect(data.galleryItems).toHaveLength(2);
    expect(data.galleryItems?.[1].imageUrl).toBe('https://example.com/b.jpg');
  });

  it('falls back to alternative image fields', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [{ image: 'https://example.com/img.jpg' }],
          },
        },
      ],
      data,
    );

    expect(data.heroImageUrl).toBe('https://example.com/img.jpg');
  });

  it('falls back to alternative video fields', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'serperVideoSearch',
          result: {
            results: [
              {
                url: 'https://youtube.com/watch?v=abc',
                title: 'Alt-field video',
              },
            ],
          },
        },
      ],
      data,
    );

    expect(data.heroVideoUrl).toBe('https://youtube.com/watch?v=abc');
  });

  it('ignores images from untrusted domains', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [
              {
                imageUrl:
                  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcBad',
                title: 'Google thumbnail',
              },
              { imageUrl: 'https://example.com/valid.jpg', title: 'Valid' },
            ],
          },
        },
      ],
      data,
    );

    expect(data.heroImageUrl).toBe('https://example.com/valid.jpg');
    expect(data.galleryItems).toBeUndefined();
  });

  it('does not synthesize a hero for imagelist — every image stays in the gallery', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [
              { imageUrl: '/api/v1/storage/s/c/first', title: 'First' },
              { imageUrl: '/api/v1/storage/s/c/second', title: 'Second' },
            ],
          },
        },
      ],
      data,
      'imagelist',
    );

    expect(data.heroImageUrl).toBeUndefined();
    expect(data.galleryItems).toHaveLength(2);
    expect(data.galleryItems?.[0].imageUrl).toBe('/api/v1/storage/s/c/first');
  });

  it('does not synthesize a hero for videolist — every video stays in the playlist', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'serperVideoSearch',
          result: {
            results: [
              { videoUrl: 'https://youtube.com/watch?v=first', title: 'First' },
              { videoUrl: 'https://youtube.com/watch?v=second', title: 'S' },
            ],
          },
        },
      ],
      data,
      'videolist',
    );

    expect(data.heroVideoUrl).toBeUndefined();
    expect(data.videoGalleryItems).toHaveLength(2);
    expect(data.videoGalleryItems?.[0].videoUrl).toBe(
      'https://youtube.com/watch?v=first',
    );
  });

  it('prefers the server-provided (deduped) available videos over tool results', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'brightDataVideoSearch',
          result: {
            results: [
              {
                videoUrl: 'https://youtube.com/watch?v=old-repeat',
                title: 'Repeat',
              },
            ],
          },
        },
      ],
      data,
      'videolist',
      [],
      [{ url: 'https://youtube.com/watch?v=new', title: 'New' }],
    );

    expect(data.videoGalleryItems).toHaveLength(1);
    expect(data.videoGalleryItems?.[0].videoUrl).toBe(
      'https://youtube.com/watch?v=new',
    );
  });

  it('does not re-add tool-result media when the server pool is empty (repeat/contradiction guard)', () => {
    const data: HarnessResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'brightDataVideoSearch',
          result: {
            results: [
              { videoUrl: 'https://youtube.com/watch?v=repeat', title: 'R' },
            ],
          },
        },
      ],
      data,
      'videolist',
      [],
      [],
    );

    expect(data.videoGalleryItems).toBeUndefined();
  });
});
