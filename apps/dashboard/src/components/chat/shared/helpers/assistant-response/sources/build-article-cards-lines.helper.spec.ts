import { describe, expect, it } from 'vitest';

import { buildArticleCardsLines } from './build-article-cards-lines.helper';

describe('buildArticleCardsLines', () => {
  it('returns no lines when there are no cards', () => {
    expect(buildArticleCardsLines(undefined)).toEqual([]);
    expect(buildArticleCardsLines([])).toEqual([]);
  });

  it('prefers the title, then link label, then "card"', () => {
    const lines = buildArticleCardsLines([
      { title: 'Titled', url: 'https://a' },
      { linkLabel: 'Labeled', url: 'https://b' },
      { url: 'https://c' },
    ]);
    expect(lines).toEqual([
      'Article cards:',
      '- Titled (https://a)',
      '- Labeled (https://b)',
      '- card (https://c)',
    ]);
  });

  it('omits the URL parenthesized part when absent', () => {
    expect(buildArticleCardsLines([{ title: 'No url' }])).toEqual([
      'Article cards:',
      '- No url',
    ]);
  });
});
