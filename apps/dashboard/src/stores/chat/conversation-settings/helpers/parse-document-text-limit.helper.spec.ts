import { describe, expect, it } from 'vitest';

import { parseDocumentTextLimit } from './parse-document-text-limit.helper';

describe('parseDocumentTextLimit', () => {
  it('uses the default for a missing value', () => {
    expect(parseDocumentTextLimit(null)).toBe(200_000);
  });

  it('accepts positive numeric values', () => {
    expect(parseDocumentTextLimit('1000')).toBe(1000);
    expect(parseDocumentTextLimit('0.5')).toBe(0.5);
  });

  it('uses the default for non-positive or non-finite values', () => {
    expect(parseDocumentTextLimit('0')).toBe(200_000);
    expect(parseDocumentTextLimit('-1')).toBe(200_000);
    expect(parseDocumentTextLimit('invalid')).toBe(200_000);
    expect(parseDocumentTextLimit('Infinity')).toBe(200_000);
  });
});
