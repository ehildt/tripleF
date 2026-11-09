import { describe, expect, it } from 'vitest';

import { parseConversationScrollModes } from './parse-conversation-scroll-modes.helper';

describe('parseConversationScrollModes', () => {
  it('retains valid overrides and omits malformed entries', () => {
    expect(
      parseConversationScrollModes(
        '{"one":"native","two":"carousel","three":"invalid"}',
      ),
    ).toEqual({ one: 'native', two: 'carousel' });
  });

  it('uses no overrides for missing, corrupt, or non-record data', () => {
    expect(parseConversationScrollModes(null)).toEqual({});
    expect(parseConversationScrollModes('{')).toEqual({});
    expect(parseConversationScrollModes('[]')).toEqual({});
  });
});
