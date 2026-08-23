import { describe, expect, it } from 'vitest';

import { ocrToText } from './ocr-to-text.helper';

describe('ocrToText', () => {
  it('converts ocr data to readable text with labeled extracted text', () => {
    const result = ocrToText({
      category: 'Document',
      title: 'Receipt scan',
      sectionContent: 'Total: 42.00 EUR',
      keyFindings: [{ text: 'Date is unreadable' }],
    });

    expect(result).toContain('Category: Document');
    expect(result).toContain('Title: Receipt scan');
    expect(result).toContain('Extracted text:\nTotal: 42.00 EUR');
    expect(result).toContain('Observations:');
    expect(result).toContain('- Date is unreadable');
  });

  it('returns empty string for empty data', () => {
    expect(ocrToText({})).toBe('');
  });
});
