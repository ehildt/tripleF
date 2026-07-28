import { describe, expect, it } from 'vitest';

import { summaryToText } from './summary-to-text.helper';

describe('summaryToText', () => {
  it('converts summary data to readable text', () => {
    const result = summaryToText({
      category: 'Recap',
      title: 'Gothic remake discussion',
      subtitle: 'So far',
      summary: 'We covered the remake announcement and platforms.',
      keyFindings: [{ text: 'Release window is 2026' }],
      sources: [{ title: 'THQ Nordic', url: 'https://thqnordic.com' }],
    });

    expect(result).toContain('Category: Recap');
    expect(result).toContain('Title: Gothic remake discussion');
    expect(result).toContain(
      'We covered the remake announcement and platforms.',
    );
    expect(result).toContain('Key points:');
    expect(result).toContain('- Release window is 2026');
    expect(result).toContain('Sources:');
    expect(result).toContain('- THQ Nordic (https://thqnordic.com)');
  });

  it('omits media galleries', () => {
    const result = summaryToText({
      summary: 'Recap.',
      galleryItems: [{ imageUrl: 'https://example.com/a.jpg' }],
      videoGalleryItems: [{ videoUrl: 'https://example.com/v.mp4' }],
    });

    expect(result).toContain('Recap.');
    expect(result).not.toContain('a.jpg');
    expect(result).not.toContain('v.mp4');
  });

  it('returns empty string for empty data', () => {
    expect(summaryToText({})).toBe('');
  });
});
