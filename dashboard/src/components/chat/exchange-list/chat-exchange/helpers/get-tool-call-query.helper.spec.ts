import { describe, expect, it } from 'vitest';

import { getToolCallQuery } from './get-tool-call-query.helper';

describe('getToolCallQuery', () => {
  it('extracts query string from input object', () => {
    expect(getToolCallQuery({ query: 'search term' })).toBe('search term');
  });

  it('returns empty string when query is not a string', () => {
    expect(getToolCallQuery({ query: 42 })).toBe('');
  });

  it('returns empty string when no query property', () => {
    expect(getToolCallQuery({ other: 'value' })).toBe('');
  });

  it('returns empty string for null input', () => {
    expect(getToolCallQuery(null)).toBe('');
  });
});
