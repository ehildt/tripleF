import { describe, expect, it } from 'vitest';

import { buildSourcesLines } from './build-sources-lines.helper';

describe('buildSourcesLines', () => {
  it('returns no lines for no sources', () => {
    expect(buildSourcesLines(undefined)).toEqual([]);
    expect(buildSourcesLines([])).toEqual([]);
  });

  it('emits the heading and one line per source', () => {
    expect(buildSourcesLines([{ title: 'S', url: 'https://a' }])).toEqual([
      'Sources:',
      '- S (https://a)',
    ]);
  });
});
