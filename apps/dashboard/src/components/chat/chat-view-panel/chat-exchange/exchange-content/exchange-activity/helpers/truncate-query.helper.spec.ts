import { describe, expect, it } from 'vitest';

import { truncateQuery } from './truncate-query.helper';

describe('truncateQuery', () => {
  it('returns short queries unchanged', () => {
    expect(truncateQuery('short query')).toBe('short query');
  });

  it('truncates queries beyond 48 chars with an ellipsis', () => {
    const query = 'a'.repeat(60);
    const result = truncateQuery(query);
    expect(result).toHaveLength(49);
    expect(result.endsWith('…')).toBe(true);
  });

  it('trims trailing whitespace before the ellipsis', () => {
    const query = `${'a'.repeat(47)} ${'b'.repeat(10)}`;
    // slice(0, 48) ends with a space; trimEnd removes it.
    expect(truncateQuery(query)).toBe(`${'a'.repeat(47)}…`);
  });
});
