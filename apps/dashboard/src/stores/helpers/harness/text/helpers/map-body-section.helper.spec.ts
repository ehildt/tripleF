import { describe, expect, it } from 'vitest';

import { mapBodySection } from './map-body-section.helper';

const toOptionalString = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v : undefined;
const normalizeKeyFindings = (v: unknown) =>
  Array.isArray(v) ? v.map((i) => ({ text: String(i) })) : undefined;

describe('mapBodySection', () => {
  it('normalizes a body section and drops untrusted image URLs', () => {
    const result = mapBodySection(
      {
        topic: 'T',
        content: 'C',
        heroImageUrl: 'javascript:alert(1)',
        heroImageAlt: 'alt',
        strengths: ['s'],
      },
      toOptionalString,
      normalizeKeyFindings,
    );
    expect(result.topic).toBe('T');
    expect(result.heroImageUrl).toBeUndefined();
    expect(result.strengths).toEqual([{ text: 's' }]);
  });
});
