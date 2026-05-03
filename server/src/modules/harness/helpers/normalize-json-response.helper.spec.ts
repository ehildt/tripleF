import { describe, expect, it } from 'vitest';

import { normalizeJsonResponse } from './normalize-json-response.helper.js';

describe('normalizeJsonResponse', () => {
  it('coerces keyFindings strings into objects with text', () => {
    const result = normalizeJsonResponse(
      {
        keyFindings: [
          'first observation',
          { text: 'already valid' },
          '',
          null,
          'second observation',
        ],
      },
      'describe',
    );

    expect(result.keyFindings).toEqual([
      { text: 'first observation' },
      { text: 'already valid' },
      { text: 'second observation' },
    ]);
  });

  it('coerces keyPoints strings into objects with text for news', () => {
    const result = normalizeJsonResponse(
      {
        keyPoints: ['point one', 'point two'],
      },
      'news',
    );

    expect(result.keyPoints).toEqual([
      { text: 'point one' },
      { text: 'point two' },
    ]);
  });

  it('coerces sources strings into objects with url', () => {
    const result = normalizeJsonResponse(
      {
        sources: [
          'https://example.com/article',
          { url: 'https://already.com', title: 'Already' },
          'not-a-url',
          '',
        ],
      },
      'describe',
    );

    expect(result.sources).toEqual([
      { url: 'https://example.com/article' },
      { url: 'https://already.com', title: 'Already' },
    ]);
  });

  it('adds an empty title to coerced news sources', () => {
    const result = normalizeJsonResponse(
      {
        sources: ['https://example.com/article'],
      },
      'news',
    );

    expect(result.sources).toEqual([
      { url: 'https://example.com/article', title: '' },
    ]);
  });

  it('coerces galleryItems strings into objects with imageUrl', () => {
    const result = normalizeJsonResponse(
      {
        galleryItems: [
          'https://example.com/img.jpg',
          { imageUrl: 'https://example.com/valid.jpg' },
          'not-a-url',
        ],
      },
      'article',
    );

    expect(result.galleryItems).toEqual([
      { imageUrl: 'https://example.com/img.jpg' },
      { imageUrl: 'https://example.com/valid.jpg' },
    ]);
  });

  it('coerces videoGalleryItems strings into objects with videoUrl', () => {
    const result = normalizeJsonResponse(
      {
        videoGalleryItems: [
          'https://youtube.com/watch?v=abc',
          { videoUrl: 'https://vimeo.com/123' },
        ],
      },
      'article',
    );

    expect(result.videoGalleryItems).toEqual([
      { videoUrl: 'https://youtube.com/watch?v=abc' },
      { videoUrl: 'https://vimeo.com/123' },
    ]);
  });

  it('coerces relatedStories strings into objects for news', () => {
    const result = normalizeJsonResponse(
      {
        relatedStories: ['https://example.com/story'],
      },
      'news',
    );

    expect(result.relatedStories).toEqual([
      { url: 'https://example.com/story', title: '' },
    ]);
  });

  it('coerces cards strings into objects with url for article', () => {
    const result = normalizeJsonResponse(
      {
        cards: ['https://example.com/card'],
      },
      'article',
    );

    expect(result.cards).toEqual([{ url: 'https://example.com/card' }]);
  });

  it('leaves non-array fields untouched', () => {
    const result = normalizeJsonResponse(
      {
        category: 'Art',
        title: 'Title',
        keyFindings: 'not an array',
      },
      'describe',
    );

    expect(result.category).toBe('Art');
    expect(result.title).toBe('Title');
    expect(result.keyFindings).toBe('not an array');
  });

  it('removes empty arrays and undefined values safely', () => {
    const result = normalizeJsonResponse(
      {
        keyFindings: [],
        sources: [],
      },
      'describe',
    );

    expect(result.keyFindings).toEqual([]);
    expect(result.sources).toEqual([]);
  });
});
