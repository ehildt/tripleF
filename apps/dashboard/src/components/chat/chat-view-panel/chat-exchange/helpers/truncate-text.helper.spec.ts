import { describe, expect, it } from 'vitest';

import { truncateText } from './truncate-text.helper';

describe('truncateText', () => {
  it('returns text unchanged when shorter than max', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('truncates at word boundary', () => {
    expect(truncateText('hello world foo', 11)).toBe('hello world');
  });

  it('truncates at max when no space available', () => {
    expect(truncateText('helloworld', 5)).toBe('hello');
  });
});
