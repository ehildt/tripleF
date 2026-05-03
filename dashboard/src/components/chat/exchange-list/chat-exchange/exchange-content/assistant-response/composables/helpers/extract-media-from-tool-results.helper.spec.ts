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
          toolName: 'braveImageSearch',
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
          toolName: 'braveVideoSearch',
          result: {
            results: [{ url: 'https://youtube.com/watch?v=abc' }],
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
});
