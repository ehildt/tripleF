import { describe, expect, it } from 'vitest';

import { buildSourceLine } from './build-source-line.helper';

describe('buildSourceLine', () => {
  it('joins title, source name, and url', () => {
    expect(
      buildSourceLine({
        title: 'IGN Review',
        sourceName: 'IGN',
        url: 'https://ign.com/review',
      }),
    ).toBe('- IGN Review — IGN (https://ign.com/review)');
  });

  it('omits the url part when missing', () => {
    expect(buildSourceLine({ title: 'Press release' })).toBe('- Press release');
  });

  it('falls back to the url alone when no label exists', () => {
    expect(buildSourceLine({ url: 'https://example.com' })).toBe(
      '-  (https://example.com)',
    );
  });
});
