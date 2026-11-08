import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { cleanResponseArrays } from './clean-response-arrays.helper';

describe('cleanResponseArrays', () => {
  it('clears an untrusted hero video', () => {
    const data: AssistantResponseData = {
      heroVideoUrl: 'https://example.com/x',
    };
    cleanResponseArrays(data);
    expect(data.heroVideoUrl).toBeUndefined();
  });

  it('drops a hero video that has no title and clears its chrome', () => {
    const data: AssistantResponseData = {
      heroVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      heroVideoCaption: 'caption',
    };
    cleanResponseArrays(data);
    expect(data.heroVideoUrl).toBeUndefined();
    expect(data.heroVideoTitle).toBeUndefined();
    expect(data.heroVideoCaption).toBeUndefined();
  });

  it('filters gallery items to trusted image URLs', () => {
    const data: AssistantResponseData = {
      galleryItems: [
        { imageUrl: 'https://example.com/a.jpg' },
        { imageUrl: 'javascript:alert(1)' },
      ],
    };
    cleanResponseArrays(data);
    expect(data.galleryItems).toEqual([
      { imageUrl: 'https://example.com/a.jpg' },
    ]);
  });

  it('blanks dangerous link URLs on cards and sources', () => {
    const data: AssistantResponseData = {
      cards: [{ title: 'Card', url: 'javascript:alert(1)' }],
      sources: [{ title: 'Source', url: 'data:text/html,x' }],
    };
    cleanResponseArrays(data);
    expect(data.cards?.[0].url).toBeUndefined();
    expect(data.sources?.[0].url).toBeUndefined();
  });

  it('drops related stories without a trusted thumbnail', () => {
    const data: AssistantResponseData = {
      relatedStories: [
        { title: 'No image', url: 'https://a' },
        {
          title: 'Valid',
          url: 'https://b',
          imageUrl: 'https://example.com/x.jpg',
        },
      ],
    };
    cleanResponseArrays(data);
    expect(data.relatedStories?.map((s) => s.title)).toEqual(['Valid']);
  });

  it('drops evaluation subjects without a name', () => {
    const data: AssistantResponseData = {
      subjects: [{ description: 'no name' }, { name: 'Kept' }],
    };
    cleanResponseArrays(data);
    expect(data.subjects?.map((s) => s.name)).toEqual(['Kept']);
  });

  it('drops shop offers without a safe link', () => {
    const data: AssistantResponseData = {
      shopOffers: [
        { title: 'No link' },
        { title: 'Safe', link: 'https://example.com' },
        { title: 'Unsafe', link: 'javascript:alert(1)' },
      ],
    };
    cleanResponseArrays(data);
    expect(data.shopOffers?.map((o) => o.title)).toEqual(['Safe']);
  });

  it('drops stat highlights missing a label or value', () => {
    const data: AssistantResponseData = {
      statHighlights: [
        { label: 'Only label', value: '' },
        { label: 'Both', value: '1' },
      ],
    };
    cleanResponseArrays(data);
    expect(data.statHighlights?.map((s) => s.label)).toEqual(['Both']);
  });

  it('drops empty text-list entries', () => {
    const data: AssistantResponseData = {
      keyFindings: [{ text: 'real' }, { text: '  ' }],
    };
    cleanResponseArrays(data);
    expect(data.keyFindings).toEqual([{ text: 'real' }]);
  });
});
