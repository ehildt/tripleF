import { describe, expect, it } from 'vitest';

import type { RelatedStory } from '@/types/harness-response-data.model';

import { metaFor } from './meta-for.helper';

describe('metaFor', () => {
  it('joins source name and date with a separator', () => {
    expect(
      metaFor({ sourceName: 'Reuters', date: '2024-01-01' } as RelatedStory),
    ).toBe('Reuters · 2024-01-01');
  });

  it('returns the source name alone when there is no date', () => {
    expect(metaFor({ sourceName: 'Reuters' } as RelatedStory)).toBe('Reuters');
  });

  it('returns the date alone when there is no source name', () => {
    expect(metaFor({ date: '2024-01-01' } as RelatedStory)).toBe('2024-01-01');
  });

  it('returns an empty string when neither is present', () => {
    expect(metaFor({} as RelatedStory)).toBe('');
  });
});
