import { describe, expect, it } from 'vitest';

import { parseConversationSourceTagsMenuAlwaysShow } from './parse-conversation-source-tags-menu-always-show.helper';

describe('parseConversationSourceTagsMenuAlwaysShow', () => {
  it('retains complete valid overrides and omits malformed entries', () => {
    expect(
      parseConversationSourceTagsMenuAlwaysShow(
        '{"one":{"sources":false,"view":true},"two":{"view":false},"three":null}',
      ),
    ).toEqual({ one: { sources: false, view: true } });
  });

  it('uses no overrides for missing, corrupt, or non-record data', () => {
    expect(parseConversationSourceTagsMenuAlwaysShow(null)).toEqual({});
    expect(parseConversationSourceTagsMenuAlwaysShow('{')).toEqual({});
    expect(parseConversationSourceTagsMenuAlwaysShow('[]')).toEqual({});
  });
});
