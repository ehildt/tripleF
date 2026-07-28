import { describe, expect, it } from 'vitest';

import { articleToText } from './article-to-text.helper';

describe('articleToText', () => {
  it('converts article data to readable text', () => {
    const result = articleToText({
      category: 'Gaming',
      title: 'Neverness to Everness',
      subtitle: 'Overview',
      summary: 'An urban open-world RPG.',
      sectionTitle: 'Details',
      sectionContent: 'Releases April 29, 2026.',
      keyFindings: [{ text: 'Urban setting' }, { text: 'Hotta Studio' }],
      quote: 'A bold experiment.',
      conclusion: 'Worth watching.',
      sources: [{ title: 'IGN', url: 'https://ign.com' }],
      cards: [{ title: 'Read more', url: 'https://example.com/more' }],
    });

    expect(result).toContain('Category: Gaming');
    expect(result).toContain('Title: Neverness to Everness');
    expect(result).toContain('Subtitle: Overview');
    expect(result).toContain('An urban open-world RPG.');
    expect(result).toContain('Section: Details');
    expect(result).toContain('Releases April 29, 2026.');
    expect(result).toContain('Key findings:');
    expect(result).toContain('- Urban setting');
    expect(result).toContain('Quote: A bold experiment.');
    expect(result).toContain('Conclusion: Worth watching.');
    expect(result).toContain('Sources:');
    expect(result).toContain('- IGN (https://ign.com)');
    expect(result).toContain('Article cards:');
    expect(result).toContain('- Read more (https://example.com/more)');
  });

  it('omits editorial metadata and media galleries', () => {
    const result = articleToText({
      title: 'Article',
      author: 'Jane Doe',
      publishDate: '2026-04-01',
      readTime: '5 min',
      heroImageUrl: 'https://example.com/hero.jpg',
      galleryItems: [{ imageUrl: 'https://example.com/a.jpg' }],
      videoGalleryItems: [{ videoUrl: 'https://example.com/v.mp4' }],
    });

    expect(result).toContain('Title: Article');
    expect(result).not.toContain('Jane Doe');
    expect(result).not.toContain('2026-04-01');
    expect(result).not.toContain('5 min');
    expect(result).not.toContain('hero.jpg');
    expect(result).not.toContain('a.jpg');
    expect(result).not.toContain('v.mp4');
  });

  it('returns empty string for empty data', () => {
    expect(articleToText({})).toBe('');
  });
});
