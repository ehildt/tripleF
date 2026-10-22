import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { extractMediaFromToolResults } from './extract-media-from-tool-results.helper';

describe('extractMediaFromToolResults', () => {
  it('does nothing when there are no usable results', () => {
    const data: AssistantResponseData = {};
    extractMediaFromToolResults([], data);
    expect(data).toEqual({});
  });

  it('builds gallery items from image search results', () => {
    const data: AssistantResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'webImageSearch',
          result: {
            results: [
              { imageUrl: 'https://example.com/a.jpg', title: 'Pic A' },
              { imageUrl: 'https://example.com/b.jpg', title: 'Pic B' },
            ],
          },
        },
      ],
      data,
    );
    expect(data.heroImageUrl).toBe('https://example.com/a.jpg');
    expect(data.galleryItems?.map((i) => i.imageUrl)).toEqual([
      'https://example.com/b.jpg',
    ]);
  });

  it('promotes the first titled video to hero when no hero exists', () => {
    const data: AssistantResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'webVideoSearch',
          result: {
            results: [
              { videoUrl: 'https://www.youtube.com/watch?v=x', title: 'Vid' },
            ],
          },
        },
      ],
      data,
    );
    expect(data.heroVideoUrl).toBe('https://www.youtube.com/watch?v=x');
    expect(data.heroVideoTitle).toBe('Vid');
  });

  it('falls back to an image hero only when no video hero is available', () => {
    const data: AssistantResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'webImageSearch',
          result: {
            results: [{ imageUrl: 'https://example.com/a.jpg', title: 'Pic' }],
          },
        },
      ],
      data,
    );
    expect(data.heroImageUrl).toBe('https://example.com/a.jpg');
  });

  it('does not synthesize a hero for the imagelist template', () => {
    const data: AssistantResponseData = {};
    extractMediaFromToolResults(
      [
        {
          toolName: 'webVideoSearch',
          result: {
            results: [
              { videoUrl: 'https://www.youtube.com/watch?v=x', title: 'Vid' },
            ],
          },
        },
      ],
      data,
      'imagelist',
    );
    expect(data.heroVideoUrl).toBeUndefined();
  });

  it('prefers the server-provided media pool over scraping tool results', () => {
    const data: AssistantResponseData = {};
    extractMediaFromToolResults(
      [{ toolName: 'webImageSearch', result: { results: [] } }],
      data,
      undefined,
      [
        { url: 'https://example.com/server-a.jpg', title: 'Server A' },
        { url: 'https://example.com/server-b.jpg', title: 'Server B' },
      ],
    );
    expect(data.heroImageUrl).toBe('https://example.com/server-a.jpg');
    expect(data.galleryItems?.[0].imageUrl).toBe(
      'https://example.com/server-b.jpg',
    );
  });
});
