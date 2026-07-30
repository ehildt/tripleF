import { describe, expect, it } from 'vitest';

import { inferConversationTitle } from './infer-conversation-title.helper';

describe('inferConversationTitle', () => {
  it('leaves a custom title untouched', () => {
    expect(inferConversationTitle('My chat', 'new content')).toBe('My chat');
  });

  it('adopts the first 50 characters of the first exchange', () => {
    expect(inferConversationTitle('New Conversation', 'x'.repeat(80))).toBe(
      'x'.repeat(50),
    );
  });

  it('falls back to the default title for empty content', () => {
    expect(inferConversationTitle('New Conversation', '')).toBe(
      'New Conversation',
    );
  });
});
