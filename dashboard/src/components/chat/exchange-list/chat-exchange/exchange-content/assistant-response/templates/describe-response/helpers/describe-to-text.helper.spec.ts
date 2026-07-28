import { describe, expect, it } from 'vitest';

import { describeToText } from './describe-to-text.helper';

describe('describeToText', () => {
  it('converts describe data to readable text', () => {
    const result = describeToText({
      category: 'Photo',
      title: 'Neuschwanstein castle',
      subtitle: 'Bavaria',
      sectionContent: 'A romanesque revival palace on a hill.',
      keyFindings: [{ text: 'Snow on the towers' }],
      sources: [{ title: 'Wikipedia', url: 'https://wikipedia.org' }],
    });

    expect(result).toContain('Category: Photo');
    expect(result).toContain('Title: Neuschwanstein castle');
    expect(result).toContain('Subtitle: Bavaria');
    expect(result).toContain('A romanesque revival palace on a hill.');
    expect(result).toContain('Key observations:');
    expect(result).toContain('- Snow on the towers');
    expect(result).toContain('Sources:');
    expect(result).toContain('- Wikipedia (https://wikipedia.org)');
  });

  it('omits the gallery of user-uploaded images', () => {
    const result = describeToText({
      title: 'Photo',
      galleryItems: [{ imageUrl: 'https://example.com/upload.jpg' }],
    });

    expect(result).toContain('Title: Photo');
    expect(result).not.toContain('upload.jpg');
  });

  it('returns empty string for empty data', () => {
    expect(describeToText({})).toBe('');
  });
});
