import { describe, expect, it } from 'vitest';

import { buildDefaultTemplateParts } from './build-default-template-parts.helper';
import { parseTemplatePartsVisibility } from './parse-template-parts-visibility.helper';

describe('parseTemplatePartsVisibility', () => {
  it('returns fresh defaults for a missing value', () => {
    const defaults = buildDefaultTemplateParts();
    const result = parseTemplatePartsVisibility(null);

    expect(result).toEqual(defaults);
    expect(result).not.toBe(defaults);
    expect(result.article).not.toBe(defaults.article);
  });

  it('applies only explicit false values for known parts', () => {
    const result = parseTemplatePartsVisibility(
      JSON.stringify({
        article: {
          hero: false,
          quote: true,
          conclusion: 0,
          sources: 'false',
          unknown: false,
        },
        unknown: { hero: false },
      }),
    );

    expect(result.article.hero).toBe(false);
    expect(result.article.quote).toBe(true);
    expect(result.article.conclusion).toBe(true);
    expect(result.article.sources).toBe(true);
    expect(result.article).not.toHaveProperty('unknown');
    expect(result).not.toHaveProperty('unknown');
  });

  it('keeps valid template overrides when another container is malformed', () => {
    const result = parseTemplatePartsVisibility(
      JSON.stringify({
        article: null,
        news: { sources: false },
        compare: [],
      }),
    );

    expect(result.article.hero).toBe(true);
    expect(result.news.sources).toBe(false);
    expect(result.compare.sources).toBe(true);
  });

  it.each(['{', 'null', '[]', 'true', '"text"'])(
    'returns pristine defaults for corrupt or non-record payload %s',
    (saved) => {
      expect(parseTemplatePartsVisibility(saved)).toEqual(
        buildDefaultTemplateParts(),
      );
    },
  );

  it('does not share nested maps between parses', () => {
    const first = parseTemplatePartsVisibility(
      JSON.stringify({ article: { hero: false } }),
    );
    const second = parseTemplatePartsVisibility(null);

    expect(first.article.hero).toBe(false);
    expect(second.article.hero).toBe(true);
    expect(first.article).not.toBe(second.article);
  });
});
