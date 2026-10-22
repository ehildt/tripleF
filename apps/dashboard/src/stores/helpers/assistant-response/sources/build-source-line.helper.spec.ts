import { describe, expect, it } from 'vitest';

import { buildSourceLine } from './build-source-line.helper';

describe('buildSourceLine', () => {
  it('joins title and source name with an em dash', () => {
    expect(
      buildSourceLine({ title: 'T', sourceName: 'S', url: 'https://a' }),
    ).toBe('- T — S (https://a)');
  });

  it('omits the URL parenthesized part when absent', () => {
    expect(buildSourceLine({ title: 'T' })).toBe('- T');
  });

  it('falls back to an empty label when nothing is present', () => {
    expect(buildSourceLine({ url: 'https://a' })).toBe('-  (https://a)');
  });
});
