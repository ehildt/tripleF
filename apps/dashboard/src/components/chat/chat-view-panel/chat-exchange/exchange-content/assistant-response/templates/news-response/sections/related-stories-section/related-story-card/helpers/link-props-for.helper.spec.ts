import { describe, expect, it } from 'vitest';

import type { RelatedStory } from '@/types/harness-response-data.model';

import { linkPropsFor } from './link-props-for.helper';

describe('linkPropsFor', () => {
  it('builds a whole-card link when a URL exists', () => {
    expect(
      linkPropsFor({ url: 'https://x.com', title: 'T' } as RelatedStory),
    ).toEqual({
      is: 'a',
      href: 'https://x.com',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'T',
    });
  });

  it('uses the URL as the title fallback', () => {
    expect(linkPropsFor({ url: 'https://x.com' } as RelatedStory).title).toBe(
      'https://x.com',
    );
  });

  it('returns an inert wrapper when there is no URL', () => {
    expect(linkPropsFor({} as RelatedStory)).toEqual({ is: 'div' });
  });
});
