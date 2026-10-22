import { describe, expect, it } from 'vitest';

import { mapBodySectionWithCleanedHero } from './map-body-section-with-cleaned-hero.helper';

const filterArray = <T>(
  value: T[] | undefined,
  predicate: (item: T) => boolean,
) => (Array.isArray(value) ? value.filter(predicate) : value);

describe('mapBodySectionWithCleanedHero', () => {
  it('drops an untrusted image URL and its dependent fields', () => {
    const result = mapBodySectionWithCleanedHero(
      {
        topic: 'T',
        content: 'C',
        heroImageUrl: 'javascript:alert(1)',
        heroImageAlt: 'alt',
        heroCaption: 'cap',
        strengths: [{ text: 's' }],
        weaknesses: [],
        recommendations: [{ text: 'r' }],
      },
      filterArray,
    );
    expect(result.heroImageUrl).toBeUndefined();
    expect(result.heroImageAlt).toBeUndefined();
    expect(result.heroCaption).toBeUndefined();
    expect(result.topic).toBe('T');
  });

  it('drops a video hero without a title', () => {
    const result = mapBodySectionWithCleanedHero(
      { heroVideoUrl: 'https://x/v.mp4', heroVideoTitle: '  ' },
      filterArray,
    );
    expect(result.heroVideoUrl).toBeUndefined();
  });
});
