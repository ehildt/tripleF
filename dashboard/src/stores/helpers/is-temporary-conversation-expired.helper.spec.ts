import { describe, expect, it } from 'vitest';

import { isTemporaryConversationExpired } from './is-temporary-conversation-expired.helper';

const now = 1_800_000_000_000;
const week = 7 * 24 * 60 * 60 * 1000;

describe('isTemporaryConversationExpired', () => {
  it('expires temporary conversations untouched for over a week', () => {
    expect(
      isTemporaryConversationExpired('temporary', now - week - 1, now),
    ).toBe(true);
  });

  it('keeps temporary conversations inside the TTL', () => {
    expect(isTemporaryConversationExpired('temporary', now - week, now)).toBe(
      false,
    );
    expect(
      isTemporaryConversationExpired('temporary', now - week + 1000, now),
    ).toBe(false);
  });

  it('never expires persistent conversations', () => {
    expect(isTemporaryConversationExpired('persistent', 0, now)).toBe(false);
  });

  it('treats a missing type as temporary', () => {
    expect(isTemporaryConversationExpired(undefined, now - week - 1, now)).toBe(
      true,
    );
  });
});
