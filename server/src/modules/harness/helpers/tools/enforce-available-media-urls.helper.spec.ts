import { describe, expect, it } from 'vitest';

import type { ExtractedImageItem } from '../media/extract-media-from-tools.types.js';

import { enforceAvailableMediaUrls } from './enforce-available-media-urls.helper.js';

const img = (imageUrl: string): ExtractedImageItem => ({ imageUrl });

describe('enforceAvailableMediaUrls', () => {
  it('returns the data unchanged when all media is allowed', () => {
    const data = {
      heroImageUrl: 'https://img.com/a.jpg',
      galleryItems: [{ imageUrl: 'https://img.com/b.jpg' }],
    };
    const result = enforceAvailableMediaUrls(
      data,
      [img('https://img.com/a.jpg'), img('https://img.com/b.jpg')],
      [],
    );
    expect(result).toBe(data);
  });

  it('returns undefined for undefined data', () => {
    expect(enforceAvailableMediaUrls(undefined, [], [])).toBe(undefined);
  });

  it('blanks a disallowed hero image url', () => {
    const result = enforceAvailableMediaUrls(
      { heroImageUrl: 'https://evil.com/x.jpg' },
      [],
      [],
    );
    expect(result?.heroImageUrl).toBe('');
  });

  it('filters gallery items not in the allowed set', () => {
    const result = enforceAvailableMediaUrls(
      {
        galleryItems: [
          { imageUrl: 'https://img.com/a.jpg' },
          { imageUrl: 'https://evil.com/x.jpg' },
        ],
      },
      [img('https://img.com/a.jpg')],
      [],
    );
    expect(result?.galleryItems).toEqual([
      { imageUrl: 'https://img.com/a.jpg' },
    ]);
  });

  it('does not repeat a hero image in the gallery', () => {
    const result = enforceAvailableMediaUrls(
      {
        heroImageUrl: 'https://img.com/a.jpg',
        galleryItems: [
          { imageUrl: 'https://img.com/a.jpg' },
          { imageUrl: 'https://img.com/b.jpg' },
        ],
      },
      [img('https://img.com/a.jpg'), img('https://img.com/b.jpg')],
      [],
    );
    expect(result?.galleryItems).toEqual([
      { imageUrl: 'https://img.com/b.jpg' },
    ]);
  });

  it('blanks a disallowed hero video url', () => {
    const result = enforceAvailableMediaUrls(
      { heroVideoUrl: 'https://evil.com/v.mp4' },
      [],
      [],
    );
    expect(result?.heroVideoUrl).toBe('');
  });
});
