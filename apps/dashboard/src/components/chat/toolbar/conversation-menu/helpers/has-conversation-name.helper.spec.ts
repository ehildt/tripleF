import { describe, expect, it } from 'vitest';

import { hasConversationName } from './has-conversation-name.helper';

describe('hasConversationName', () => {
  it('returns true for a non-empty name', () => {
    expect(hasConversationName('Code Review')).toBe(true);
  });

  it('returns false for an empty name', () => {
    expect(hasConversationName('')).toBe(false);
  });

  it('returns false for a whitespace-only name', () => {
    expect(hasConversationName('   ')).toBe(false);
  });
});
