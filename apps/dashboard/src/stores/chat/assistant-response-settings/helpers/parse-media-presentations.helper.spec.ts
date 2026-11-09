import { describe, expect, it } from 'vitest';

import { parseMediaPresentations } from './parse-media-presentations.helper';

describe('parseMediaPresentations', () => {
  it('applies valid gallery/list choices over defaults', () => {
    expect(
      parseMediaPresentations('{"image":"list","video":"gallery"}'),
    ).toEqual({ image: 'list', video: 'gallery' });
  });

  it('ignores invalid choices and corrupt JSON', () => {
    expect(parseMediaPresentations('{"image":"grid"}')).toEqual({
      image: 'gallery',
      video: 'list',
    });
    expect(parseMediaPresentations('{')).toEqual({
      image: 'gallery',
      video: 'list',
    });
  });
});
