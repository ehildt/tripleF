import { describe, expect, it } from 'vitest';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { cleanHarnessResponseArrays } from './clean-harness-response-arrays.helper';

describe('cleanHarnessResponseArrays', () => {
  it('removes gallery items without an imageUrl', () => {
    const data: HarnessResponseData = {
      galleryItems: [
        { imageUrl: '/a', title: 'A' },
        { title: 'B' },
        { imageUrl: '', caption: 'C' },
      ],
    };

    cleanHarnessResponseArrays(data);

    expect(data.galleryItems).toHaveLength(1);
    expect(data.galleryItems?.[0].imageUrl).toBe('/a');
  });

  it('removes empty cards', () => {
    const data: HarnessResponseData = {
      cards: [
        { title: 'A' },
        { description: '', url: '' },
        { description: 'B' },
      ],
    };

    cleanHarnessResponseArrays(data);

    expect(data.cards).toHaveLength(2);
  });

  it('removes placeholder and empty key findings', () => {
    const data: HarnessResponseData = {
      keyFindings: [
        { text: 'undefined' },
        { text: 'null' },
        { text: '' },
        { text: 'Real finding' },
      ],
    };

    cleanHarnessResponseArrays(data);

    expect(data.keyFindings).toHaveLength(1);
    expect(data.keyFindings?.[0].text).toBe('Real finding');
  });

  it('removes placeholder and empty key points', () => {
    const data: HarnessResponseData = {
      keyPoints: [{ text: 'n/a' }, { text: '' }, { text: 'Real point' }],
    };

    cleanHarnessResponseArrays(data);

    expect(data.keyPoints).toHaveLength(1);
    expect(data.keyPoints?.[0].text).toBe('Real point');
  });

  it('removes empty sources', () => {
    const data: HarnessResponseData = {
      sources: [
        { title: 'A' },
        { title: '', url: '' },
        { url: 'https://example.com' },
      ],
    };

    cleanHarnessResponseArrays(data);

    expect(data.sources).toHaveLength(2);
  });

  it('blanks non-http(s) URLs in sources, cards, and related stories', () => {
    const jsProtocol = `${'java'}script:`;
    const data: HarnessResponseData = {
      sources: [
        { title: 'Bad', url: `${jsProtocol}alert(1)` },
        { title: 'Good', url: 'https://example.com' },
      ],
      cards: [{ title: 'Card', url: 'data:text/html;base64,abc' }],
      relatedStories: [{ title: 'Story', url: 'vbscript:msgbox(1)' }],
    };

    cleanHarnessResponseArrays(data);

    expect(data.sources).toHaveLength(2);
    expect(data.sources?.[0].url).toBeUndefined();
    expect(data.sources?.[1].url).toBe('https://example.com');
    expect(data.cards).toHaveLength(1);
    expect(data.cards?.[0].url).toBeUndefined();
    expect(data.relatedStories).toHaveLength(1);
    expect(data.relatedStories?.[0].url).toBeUndefined();
  });

  it('clears hero videos that are not valid video URLs', () => {
    const data: HarnessResponseData = {
      heroVideoUrl: `${'java'}script:alert(1)`,
    };

    cleanHarnessResponseArrays(data);

    expect(data.heroVideoUrl).toBeUndefined();
  });

  it('removes video gallery items without a videoUrl', () => {
    const data: HarnessResponseData = {
      videoGalleryItems: [
        { videoUrl: 'https://example.com/v1.mp4' },
        { videoUrl: '' },
        { title: 'No URL' },
        { videoUrl: `${'java'}script:alert(1).mp4` },
      ],
    };

    cleanHarnessResponseArrays(data);

    expect(data.videoGalleryItems).toHaveLength(1);
    expect(data.videoGalleryItems?.[0].videoUrl).toBe(
      'https://example.com/v1.mp4',
    );
  });

  it('removes non-video discussion pages from video gallery items', () => {
    const data: HarnessResponseData = {
      videoGalleryItems: [
        { videoUrl: 'https://youtube.com/watch?v=abc123' },
        { videoUrl: 'https://www.reddit.com/r/gaming/comments/x/title/' },
        { videoUrl: 'https://example.com/article.html' },
      ],
    };

    cleanHarnessResponseArrays(data);

    expect(data.videoGalleryItems).toHaveLength(1);
    expect(data.videoGalleryItems?.[0].videoUrl).toBe(
      'https://youtube.com/watch?v=abc123',
    );
  });

  it('removes gallery items with untrusted image URLs', () => {
    const data: HarnessResponseData = {
      galleryItems: [
        { imageUrl: 'https://example.com/valid.jpg', title: 'Valid' },
        {
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcBad',
          title: 'Google thumbnail',
        },
        { imageUrl: 'data:text/html;base64,abc', title: 'Not an image' },
      ],
    };

    cleanHarnessResponseArrays(data);

    expect(data.galleryItems).toHaveLength(1);
    expect(data.galleryItems?.[0].imageUrl).toBe(
      'https://example.com/valid.jpg',
    );
  });

  it('removes related stories with only an untrusted imageUrl', () => {
    const data: HarnessResponseData = {
      relatedStories: [
        { title: 'Story A' },
        {
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcBad',
        },
        { imageUrl: 'https://example.com/valid.jpg' },
      ],
    };

    cleanHarnessResponseArrays(data);

    expect(data.relatedStories).toHaveLength(2);
    expect(data.relatedStories?.[0].title).toBe('Story A');
    expect(data.relatedStories?.[1].imageUrl).toBe(
      'https://example.com/valid.jpg',
    );
  });

  it('removes empty related stories', () => {
    const data: HarnessResponseData = {
      relatedStories: [
        { title: 'Story A' },
        { title: '', url: '' },
        { imageUrl: 'https://example.com/img.jpg' },
      ],
    };

    cleanHarnessResponseArrays(data);

    expect(data.relatedStories).toHaveLength(2);
  });

  it('removes placeholder and empty evaluation list items', () => {
    const data: HarnessResponseData = {
      strengths: [{ text: 'Good' }, { text: '' }, { text: 'none' }],
      weaknesses: [{ text: '' }],
      recommendations: [{ text: 'Do this' }, { text: 'undefined' }],
    };

    cleanHarnessResponseArrays(data);

    expect(data.strengths).toHaveLength(1);
    expect(data.strengths?.[0].text).toBe('Good');
    expect(data.weaknesses).toHaveLength(0);
    expect(data.recommendations).toHaveLength(1);
    expect(data.recommendations?.[0].text).toBe('Do this');
  });

  it('leaves undefined arrays unchanged', () => {
    const data: HarnessResponseData = {};

    cleanHarnessResponseArrays(data);

    expect(data.galleryItems).toBeUndefined();
    expect(data.keyFindings).toBeUndefined();
  });
});
