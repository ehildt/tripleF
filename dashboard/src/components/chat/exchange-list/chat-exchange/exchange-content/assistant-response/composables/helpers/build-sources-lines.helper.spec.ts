import { describe, expect, it } from 'vitest';

import { buildSourcesLines } from './build-sources-lines.helper';

describe('buildSourcesLines', () => {
  it('returns no lines when sources are missing or empty', () => {
    expect(buildSourcesLines(undefined)).toEqual([]);
    expect(buildSourcesLines([])).toEqual([]);
  });

  it('prefixes the formatted sources with the heading', () => {
    const lines = buildSourcesLines([
      { title: 'Ars Technica', url: 'https://arstechnica.com/x' },
      { title: 'Reuters', sourceName: 'reuters.com' },
    ]);
    expect(lines).toEqual([
      'Sources:',
      '- Ars Technica (https://arstechnica.com/x)',
      '- Reuters — reuters.com',
    ]);
  });
});
