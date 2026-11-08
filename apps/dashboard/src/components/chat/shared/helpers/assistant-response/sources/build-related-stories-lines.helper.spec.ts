import { describe, expect, it } from 'vitest';

import { buildRelatedStoriesLines } from './build-related-stories-lines.helper';

describe('buildRelatedStoriesLines', () => {
  it('returns no lines for no stories', () => {
    expect(buildRelatedStoriesLines(undefined)).toEqual([]);
    expect(buildRelatedStoriesLines([])).toEqual([]);
  });

  it('emits the heading and one line per story', () => {
    expect(
      buildRelatedStoriesLines([
        { title: 'Story', url: 'https://example.com/a' },
      ]),
    ).toEqual(['Related stories:', '- Story (https://example.com/a)']);
  });
});
