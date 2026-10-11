import { describe, expect, it } from 'vitest';

import type { RelatedStory } from '@/types/harness-response-data.model';

import { imageAltFor } from './image-alt-for.helper';

describe('imageAltFor', () => {
  it('prefers the title', () => {
    expect(imageAltFor({ title: 'T', sourceName: 'S' } as RelatedStory)).toBe(
      'T',
    );
  });

  it('falls back to the source name', () => {
    expect(imageAltFor({ sourceName: 'S' } as RelatedStory)).toBe('S');
  });

  it('returns an empty string when neither is present', () => {
    expect(imageAltFor({} as RelatedStory)).toBe('');
  });
});
