import { describe, expect, it } from 'vitest';

import { parseConversationSourceTagsMenuCollapsed } from './parse-conversation-source-tags-menu-collapsed.helper';

describe('parseConversationSourceTagsMenuCollapsed', () => {
  it('retains complete valid overrides and omits malformed entries', () => {
    expect(
      parseConversationSourceTagsMenuCollapsed(
        '{"one":{"sources":true,"view":false},"two":{"sources":true},"three":null}',
      ),
    ).toEqual({ one: { sources: true, view: false } });
  });

  it('uses no overrides for missing, corrupt, or non-record data', () => {
    expect(parseConversationSourceTagsMenuCollapsed(null)).toEqual({});
    expect(parseConversationSourceTagsMenuCollapsed('{')).toEqual({});
    expect(parseConversationSourceTagsMenuCollapsed('[]')).toEqual({});
  });
});
