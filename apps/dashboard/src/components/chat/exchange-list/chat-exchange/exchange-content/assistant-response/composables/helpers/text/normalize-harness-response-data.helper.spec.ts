import { describe, expect, it } from 'vitest';

import type { HarnessStreamEvent } from '@/types/harness-stream-event.model';

import { normalizeHarnessResponseData } from './normalize-harness-response-data.helper';

describe('normalizeHarnessResponseData', () => {
  it('returns null for non-object input', () => {
    expect(normalizeHarnessResponseData(null, {})).toBeNull();
    expect(normalizeHarnessResponseData('text', {})).toBeNull();
  });

  it('extracts known fields and drops unknown fields', () => {
    const result = normalizeHarnessResponseData(
      { title: 'T', unknownField: 'drop me' },
      {},
    );

    expect(result).toEqual({ title: 'T' });
  });

  it('returns null when there is no meaningful content', () => {
    expect(normalizeHarnessResponseData({}, {})).toBeNull();
    expect(
      normalizeHarnessResponseData({ title: '   ', sectionContent: '' }, {}),
    ).toBeNull();
  });

  it('merges stream images into galleryItems', () => {
    const event: HarnessStreamEvent = {
      images: [
        { imageUrl: '/a', imageAlt: 'A' },
        { imageUrl: '', title: 'empty' },
      ],
    };

    const result = normalizeHarnessResponseData({ title: 'T' }, event);

    expect(result?.galleryItems).toHaveLength(1);
    expect(result?.galleryItems?.[0].imageUrl).toBe('/a');
  });

  it('cleans arrays using the same predicates', () => {
    const result = normalizeHarnessResponseData(
      {
        title: 'T',
        keyFindings: [{ text: '' }, { text: 'valid' }, { text: 'undefined' }],
        sources: [{ url: 'https://example.com' }, { title: '' }],
      },
      {},
    );

    expect(result?.keyFindings).toHaveLength(1);
    expect(result?.keyFindings?.[0].text).toBe('valid');
    expect(result?.sources).toHaveLength(1);
  });

  it('normalizes OCR-style string arrays for sectionContent and keyFindings', () => {
    const result = normalizeHarnessResponseData(
      {
        category: 'OCR',
        title: 'OCR Result',
        sectionContent: ['Line one', 'Line two'],
        keyFindings: ['Finding one', 'Finding two'],
      },
      {},
    );

    expect(result?.sectionContent).toBe('Line one\nLine two');
    expect(result?.keyFindings).toEqual([
      { text: 'Finding one' },
      { text: 'Finding two' },
    ]);
  });

  it('normalizes merge bodySections into per-topic blocks', () => {
    const result = normalizeHarnessResponseData(
      {
        title: 'T',
        bodySections: [
          {
            topic: 'Vision Pro',
            content: 'Narrative',
            strengths: [{ text: 'Great display' }, { text: '' }],
            weaknesses: 'not a list',
            recommendations: [{ text: 'Try it in store' }],
            heroImageUrl: 'https://example.com/vision-pro.jpg',
            heroImageAlt: 'Vision Pro headset',
            heroVideoUrl: 'https://youtube.com/watch?v=aaa',
            heroVideoTitle: 'Hands-on',
          },
          { topic: '' },
          'not a record',
          { heroImageUrl: 'javascript:alert(1)' },
        ],
      },
      {},
    );

    expect(result?.bodySections).toEqual([
      {
        topic: 'Vision Pro',
        content: 'Narrative',
        strengths: [{ text: 'Great display' }],
        weaknesses: undefined,
        recommendations: [{ text: 'Try it in store' }],
        heroImageUrl: 'https://example.com/vision-pro.jpg',
        heroImageAlt: 'Vision Pro headset',
        heroCaption: undefined,
        heroVideoUrl: 'https://youtube.com/watch?v=aaa',
        heroVideoTitle: 'Hands-on',
        heroVideoCaption: undefined,
      },
    ]);
  });

  it('ignores empty string arrays', () => {
    const result = normalizeHarnessResponseData(
      { title: 'T', sectionContent: [], keyFindings: [] },
      {},
    );

    expect(result?.sectionContent).toBeUndefined();
    expect(result?.keyFindings).toBeUndefined();
  });

  it('converts key finding objects to the canonical shape', () => {
    const result = normalizeHarnessResponseData(
      { title: 'T', keyFindings: [{ text: 'A' }, { text: 'B' }] },
      {},
    );

    expect(result?.keyFindings).toEqual([{ text: 'A' }, { text: 'B' }]);
  });

  it('falls back to toolResults for media when JSON fields are empty', () => {
    const event: HarnessStreamEvent = {
      toolResults: [
        {
          toolName: 'serperImageSearch',
          result: {
            results: [
              { imageUrl: 'https://example.com/hero.jpg', title: 'Hero' },
              { imageUrl: 'https://example.com/a.jpg', title: 'A' },
            ],
          },
        },
        {
          toolName: 'serperVideoSearch',
          result: {
            results: [
              { videoUrl: 'https://youtube.com/watch?v=hero', title: 'Hero' },
              { videoUrl: 'https://youtube.com/watch?v=a', title: 'A' },
              {
                videoUrl: 'https://www.reddit.com/r/gaming/comments/x/',
                title: 'Reddit',
              },
            ],
          },
        },
      ],
    };

    const result = normalizeHarnessResponseData({ title: 'T' }, event);

    expect(result?.heroVideoUrl).toBe('https://youtube.com/watch?v=hero');
    expect(result?.galleryItems).toHaveLength(2);
    expect(result?.galleryItems?.[0].imageUrl).toBe(
      'https://example.com/hero.jpg',
    );
    expect(result?.videoGalleryItems).toHaveLength(1);
    expect(result?.videoGalleryItems?.[0].videoUrl).toBe(
      'https://youtube.com/watch?v=a',
    );
  });

  it('extracts evaluation-only fields and treats them as content', () => {
    const result = normalizeHarnessResponseData(
      {
        category: 'Review',
        title: 'Stellar Blade Review',
        subtitle: 'Action RPG by Shift Up',
        subject: 'Stellar Blade',
        verdict: 'Recommended',
        score: 8.5,
        scoreLabel: 'Great',
        reasoning: 'Polished combat and visuals.',
        strengths: [{ text: 'Combat' }, { text: 'Visuals' }],
        weaknesses: [{ text: 'Story pacing' }],
        recommendations: [{ text: 'Try demo first' }],
      },
      {},
    );

    expect(result).not.toBeNull();
    expect(result?.subject).toBe('Stellar Blade');
    expect(result?.verdict).toBe('Recommended');
    expect(result?.score).toBe(8.5);
    expect(result?.scoreLabel).toBe('Great');
    expect(result?.reasoning).toBe('Polished combat and visuals.');
    expect(result?.strengths).toHaveLength(2);
    expect(result?.weaknesses).toHaveLength(1);
    expect(result?.recommendations).toHaveLength(1);
  });
});

describe('normalizeHarnessResponseData — stockmarket fields', () => {
  it('keeps quote, recommendation, news, items, and chart overlays', () => {
    const result = normalizeHarnessResponseData(
      {
        category: 'Stock',
        title: 'NVIDIA (NVDA.US)',
        subtitle: 'AI & data-center chip leader',
        shortDescription: 'Trading near $224.94.',
        currentPrice: 224.94,
        change: 0.85,
        changeP: 0.38,
        recommendation: 'Hold',
        recommendationReasoning: 'RSI neutral.',
        fundamentals: { sector: 'Technology', marketCap: '$5.5T' },
        news: [{ title: 'N', url: 'https://example.com/a', source: 'x' }],
        items: [{ name: 'NVIDIA', ticker: 'NVDA.US', price: 224.94 }],
        referenceLines: [{ value: 189.15, label: 'Support' }],
        markers: [
          {
            time: '2026-08-12',
            position: 'belowBar',
            shape: 'square',
            text: 'D',
          },
        ],
      },
      {},
    );

    expect(result?.currentPrice).toBeCloseTo(224.94);
    expect(result?.change).toBeCloseTo(0.85);
    expect(result?.changeP).toBeCloseTo(0.38);
    expect(result?.recommendation).toBe('Hold');
    expect(result?.recommendationReasoning).toBe('RSI neutral.');
    expect(result?.fundamentals?.sector).toBe('Technology');
    expect(result?.news).toHaveLength(1);
    expect(result?.items).toHaveLength(1);
    expect(result?.referenceLines).toHaveLength(1);
    expect(result?.markers).toHaveLength(1);
  });

  it('migrates legacy news keyPoints onto keyFindings', () => {
    const result = normalizeHarnessResponseData(
      { headline: 'H', keyPoints: [{ text: 'Legacy point' }] },
      {},
      'news',
    );

    expect(result?.keyFindings).toEqual([{ text: 'Legacy point' }]);
    expect(result?.keyPoints).toBeUndefined();
  });

  it('keeps product/stockmarket keyPoints untouched', () => {
    const result = normalizeHarnessResponseData(
      { title: 'T', keyPoints: [{ text: 'Spec row' }] },
      {},
      'product',
    );

    expect(result?.keyPoints).toEqual([{ text: 'Spec row' }]);
    expect(result?.keyFindings).toBeUndefined();
  });
});
