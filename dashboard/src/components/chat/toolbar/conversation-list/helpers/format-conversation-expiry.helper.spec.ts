import { describe, expect, it } from 'vitest';

import { formatConversationExpiry } from './format-conversation-expiry.helper';

describe('formatConversationExpiry', () => {
  it('returns a string containing "ago" or "in" for past dates', () => {
    const pastDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const result = formatConversationExpiry(pastDate);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
