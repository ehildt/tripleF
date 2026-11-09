import { describe, expect, it } from 'vitest';

import { buildDefaultTemplateParts } from '@/stores/template-parts-settings/helpers/build-default-template-parts.helper';
import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { filterDisabledTemplateParts } from './filter-disabled-template-parts.helper';

const data: AssistantResponseData = {
  title: 'Article',
  heroImageUrl: 'https://example.com/hero.png',
  heroImageAlt: 'Hero',
  heroCaption: 'Caption',
  heroVideoUrl: 'https://example.com/hero.mp4',
  heroVideoTitle: 'Video',
  heroVideoCaption: 'Video caption',
  galleryTitle: 'Gallery',
  galleryItems: [],
  quote: 'Quote',
  sources: [{ title: 'Source' }],
};

describe('filterDisabledTemplateParts', () => {
  it('returns the original data when every part is visible', () => {
    const visibility = buildDefaultTemplateParts();

    expect(filterDisabledTemplateParts('article', data, visibility)).toBe(data);
  });

  it('returns the original data for unknown and part-less templates', () => {
    const visibility = buildDefaultTemplateParts();

    expect(filterDisabledTemplateParts('unknown', data, visibility)).toBe(data);
    expect(filterDisabledTemplateParts('text', data, visibility)).toBe(data);
  });

  it('returns an empty object when data is absent', () => {
    expect(
      filterDisabledTemplateParts(
        'article',
        undefined,
        buildDefaultTemplateParts(),
      ),
    ).toEqual({});
  });

  it('removes every key owned by a disabled part without mutating the source', () => {
    const visibility = buildDefaultTemplateParts();
    visibility.article.hero = false;

    const result = filterDisabledTemplateParts('article', data, visibility);

    expect(result).not.toBe(data);
    expect(result).toEqual({
      title: 'Article',
      galleryTitle: 'Gallery',
      galleryItems: [],
      quote: 'Quote',
      sources: [{ title: 'Source' }],
    });
    expect(data.heroImageUrl).toBe('https://example.com/hero.png');
    expect(data.heroCaption).toBe('Caption');
  });

  it('combines keys from multiple disabled parts', () => {
    const visibility = buildDefaultTemplateParts();
    visibility.article.gallery = false;
    visibility.article.quote = false;
    visibility.article.sources = false;

    const result = filterDisabledTemplateParts('article', data, visibility);

    expect(result.galleryTitle).toBeUndefined();
    expect(result.galleryItems).toBeUndefined();
    expect(result.quote).toBeUndefined();
    expect(result.sources).toBeUndefined();
    expect(result.heroImageUrl).toBe(data.heroImageUrl);
    expect(result.title).toBe('Article');
  });
});
