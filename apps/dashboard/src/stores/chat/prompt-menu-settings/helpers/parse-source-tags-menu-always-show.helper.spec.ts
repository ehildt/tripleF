import { describe, expect, it } from 'vitest';

import { parseSourceTagsMenuAlwaysShow } from './parse-source-tags-menu-always-show.helper';

describe('parseSourceTagsMenuAlwaysShow', () => {
  it('applies valid saved booleans over defaults', () => {
    expect(
      parseSourceTagsMenuAlwaysShow('{"sources":false,"view":false}'),
    ).toEqual({ sources: false, view: false });
    expect(parseSourceTagsMenuAlwaysShow('{"view":false}')).toEqual({
      sources: true,
      view: false,
    });
  });

  it('uses defaults for missing, malformed, or corrupt values', () => {
    expect(parseSourceTagsMenuAlwaysShow(null)).toEqual({
      sources: true,
      view: true,
    });
    expect(parseSourceTagsMenuAlwaysShow('{"view":"no"}')).toEqual({
      sources: true,
      view: true,
    });
    expect(parseSourceTagsMenuAlwaysShow('{')).toEqual({
      sources: true,
      view: true,
    });
  });
});
