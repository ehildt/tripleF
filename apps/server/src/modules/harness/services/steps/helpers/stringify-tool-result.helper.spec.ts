import { describe, expect, it } from 'vitest';

import { stringifyToolResult } from './stringify-tool-result.helper.js';

describe('stringifyToolResult', () => {
  it('passes string results through unchanged', () => {
    expect(stringifyToolResult('plain text')).toBe('plain text');
  });

  it('renders structured results as JSON', () => {
    expect(
      stringifyToolResult({ title: 'A', url: 'https://example.com' }),
    ).toBe('{"title":"A","url":"https://example.com"}');
  });

  it('renders numbers and arrays as JSON', () => {
    expect(stringifyToolResult(42)).toBe('42');
    expect(stringifyToolResult([1, 2])).toBe('[1,2]');
  });

  it('renders a missing result as an empty JSON string', () => {
    expect(stringifyToolResult(undefined)).toBe('""');
    expect(stringifyToolResult(null)).toBe('""');
  });
});
