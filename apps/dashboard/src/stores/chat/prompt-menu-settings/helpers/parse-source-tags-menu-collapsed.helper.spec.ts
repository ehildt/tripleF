import { describe, expect, it } from 'vitest';

import { parseSourceTagsMenuCollapsed } from './parse-source-tags-menu-collapsed.helper';

describe('parseSourceTagsMenuCollapsed', () => {
  it('applies valid saved booleans over defaults', () => {
    expect(
      parseSourceTagsMenuCollapsed('{"sources":true,"view":true}'),
    ).toEqual({ sources: true, view: true });
    expect(parseSourceTagsMenuCollapsed('{"sources":true}')).toEqual({
      sources: true,
      view: false,
    });
  });

  it('uses defaults for missing, malformed, or corrupt values', () => {
    expect(parseSourceTagsMenuCollapsed(null)).toEqual({
      sources: false,
      view: false,
    });
    expect(parseSourceTagsMenuCollapsed('{"sources":"yes"}')).toEqual({
      sources: false,
      view: false,
    });
    expect(parseSourceTagsMenuCollapsed('{')).toEqual({
      sources: false,
      view: false,
    });
  });
});
