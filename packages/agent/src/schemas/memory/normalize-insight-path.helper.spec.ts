import { describe, expect, it } from 'vitest';

import { normalizeInsightPath } from './normalize-insight-path.helper.js';

describe('normalizeInsightPath', () => {
  it('normalizes case and whitespace into canonical probe keys', () => {
    expect(normalizeInsightPath('likes.Jazz')).toBe('likes.jazz');
    expect(normalizeInsightPath('likes.Retro Consoles')).toBe('likes.retro-consoles');
    expect(normalizeInsightPath('Interests.Software Engineering')).toBe('interests.software-engineering');
  });

  it('returns undefined for empty or blank paths', () => {
    expect(normalizeInsightPath(undefined)).toBeUndefined();
    expect(normalizeInsightPath('')).toBeUndefined();
    expect(normalizeInsightPath('   ')).toBeUndefined();
  });

  it('returns undefined for paths without a field.keyword shape', () => {
    expect(normalizeInsightPath('nofield')).toBeUndefined();
    expect(normalizeInsightPath('.keyword')).toBeUndefined();
    expect(normalizeInsightPath('field.')).toBeUndefined();
    expect(normalizeInsightPath('field.   ')).toBeUndefined();
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeInsightPath('  likes.jazz  ')).toBe('likes.jazz');
  });
});
