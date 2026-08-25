import { describe, expect, it } from 'vitest';

import { normalizeTags } from './normalize-tags.helper.js';

describe('normalizeTags', () => {
  it('lowercases, trims, and dedupes tags', () => {
    expect(normalizeTags(['Work', ' rust ', 'work'])).toEqual(['work', 'rust']);
  });

  it('collapses internal whitespace runs', () => {
    expect(normalizeTags(['web  dev'])).toEqual(['web dev']);
  });

  it('drops non-strings, empties, and overlong tags', () => {
    expect(normalizeTags([42, '', '   ', 'x'.repeat(41), 'ok'])).toEqual([
      'ok',
    ]);
  });

  it('caps at 8 tags', () => {
    const tags = Array.from({ length: 12 }, (_, i) => `t${i}`);
    expect(normalizeTags(tags)).toEqual(
      Array.from({ length: 8 }, (_, i) => `t${i}`),
    );
  });

  it('returns an empty array for non-array input', () => {
    expect(normalizeTags('work')).toEqual([]);
    expect(normalizeTags(undefined)).toEqual([]);
  });
});
