import { describe, expect, it } from 'vitest';

import { isTemporaryConversationExpired } from './is-temporary-conversation-expired.helper';

const now = 1_800_000_000_000;
const week = 7 * 24 * 60 * 60 * 1000;

describe('isTemporaryConversationExpired', () => {
  it('expires temporary conversations untouched for over the retention window', () => {
    expect(
      isTemporaryConversationExpired('temporary', now - week - 1, now, week),
    ).toBe(true);
  });

  it('keeps temporary conversations inside the retention window', () => {
    expect(
      isTemporaryConversationExpired('temporary', now - week, now, week),
    ).toBe(false);
    expect(
      isTemporaryConversationExpired('temporary', now - week + 1000, now, week),
    ).toBe(false);
  });

  it('never expires persistent conversations regardless of retention', () => {
    expect(isTemporaryConversationExpired('persistent', 0, now, 0)).toBe(false);
    expect(isTemporaryConversationExpired('persistent', 0, now, week)).toBe(
      false,
    );
  });

  it('treats a missing type as temporary', () => {
    expect(
      isTemporaryConversationExpired(undefined, now - week - 1, now, week),
    ).toBe(true);
  });

  it('expires all temporary conversations when retention is 0', () => {
    expect(isTemporaryConversationExpired('temporary', now - 1, now, 0)).toBe(
      true,
    );
    expect(isTemporaryConversationExpired('temporary', now, now, 0)).toBe(true);
  });
});
