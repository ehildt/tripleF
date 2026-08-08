import { describe, expect, it } from 'vitest';

import { newsToText } from './news-to-text.helper';

describe('newsToText', () => {
  it('converts news data to readable text', () => {
    const result = newsToText({
      category: 'Tech',
      headline: 'Nioh 3 announced',
      deck: 'Team Ninja returns',
      lead: 'The sequel arrives next spring.',
      sectionContent: 'Preorders open Friday.',
      keyFindings: [{ text: 'New protagonist' }],
      sources: [{ title: 'Gematsu', url: 'https://gematsu.com' }],
      relatedStories: [
        { title: 'Nioh 2 sales', url: 'https://example.com/sales' },
      ],
    });

    expect(result).toContain('Category: Tech');
    expect(result).toContain('Headline: Nioh 3 announced');
    expect(result).toContain('Deck: Team Ninja returns');
    expect(result).toContain('Lead: The sequel arrives next spring.');
    expect(result).toContain('Preorders open Friday.');
    expect(result).toContain('Key findings:');
    expect(result).toContain('- New protagonist');
    expect(result).toContain('Sources:');
    expect(result).toContain('- Gematsu (https://gematsu.com)');
    expect(result).toContain('Related stories:');
    expect(result).toContain('- Nioh 2 sales (https://example.com/sales)');
  });

  it('omits editorial metadata and media galleries', () => {
    const result = newsToText({
      headline: 'Breaking',
      dateline: 'TOKYO',
      byline: 'By Jane Doe',
      galleryItems: [{ imageUrl: 'https://example.com/a.jpg' }],
      videoGalleryItems: [{ videoUrl: 'https://example.com/v.mp4' }],
    });

    expect(result).toContain('Headline: Breaking');
    expect(result).not.toContain('TOKYO');
    expect(result).not.toContain('Jane Doe');
    expect(result).not.toContain('a.jpg');
    expect(result).not.toContain('v.mp4');
  });

  it('returns empty string for empty data', () => {
    expect(newsToText({})).toBe('');
  });
});
