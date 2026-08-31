import { describe, expect, it } from 'vitest';

import { truncateDocumentSection } from './truncate-document-section.helper.js';

describe('truncateDocumentSection', () => {
  it('truncates a section whose text exceeds the limit', () => {
    expect(
      truncateDocumentSection(
        { name: 'doc.pdf', text: 'abcdef', url: 'https://example.com' },
        3,
      ),
    ).toEqual({ name: 'doc.pdf', text: 'abc', url: 'https://example.com' });
  });

  it('keeps a section whose text fits the limit', () => {
    const section = { name: 'doc.pdf', text: 'ab', url: 'https://example.com' };
    expect(truncateDocumentSection(section, 3)).toEqual(section);
  });
});
