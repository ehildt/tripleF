import { describe, expect, it } from 'vitest';

import { compareToText } from './compare-to-text.helper';

describe('compareToText', () => {
  it('converts compare data to readable text', () => {
    const result = compareToText({
      category: 'Images',
      title: 'Two castles',
      subtitle: 'Visual comparison',
      sectionContent: 'Both show hilltop castles, but styles differ.',
      note: 'Lighting varies between shots.',
      keyFindings: [{ text: 'Different roof colors' }],
      sources: [{ title: 'Wikipedia', url: 'https://wikipedia.org' }],
    });

    expect(result).toContain('Category: Images');
    expect(result).toContain('Title: Two castles');
    expect(result).toContain('Both show hilltop castles, but styles differ.');
    expect(result).toContain('Note: Lighting varies between shots.');
    expect(result).toContain('Key differences:');
    expect(result).toContain('- Different roof colors');
    expect(result).toContain('Sources:');
  });

  it('omits the gallery of user-uploaded images', () => {
    const result = compareToText({
      title: 'Compare',
      galleryItems: [{ imageUrl: 'https://example.com/upload.jpg' }],
    });

    expect(result).toContain('Title: Compare');
    expect(result).not.toContain('upload.jpg');
  });

  it('returns empty string for empty data', () => {
    expect(compareToText({})).toBe('');
  });
});
