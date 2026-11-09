import { describe, expect, it } from 'vitest';

import { parseConversationMediaPriorities } from './parse-conversation-media-priorities.helper';

describe('parseConversationMediaPriorities', () => {
  it('retains valid overrides and omits malformed entries', () => {
    expect(
      parseConversationMediaPriorities(
        '{"one":"videos","two":"images","three":"invalid"}',
      ),
    ).toEqual({ one: 'videos', two: 'images' });
  });

  it('uses no overrides for missing, corrupt, or non-record data', () => {
    expect(parseConversationMediaPriorities(null)).toEqual({});
    expect(parseConversationMediaPriorities('{')).toEqual({});
    expect(parseConversationMediaPriorities('[]')).toEqual({});
  });
});
