import { describe, expect, it } from 'vitest';

import { inferConversationTitle } from './infer-conversation-title.helper';

describe('inferConversationTitle', () => {
  it('leaves a custom title untouched', () => {
    expect(inferConversationTitle('My chat', 'new content', 'New chat')).toBe(
      'My chat',
    );
  });

  it('adopts the first 50 characters of the first exchange', () => {
    expect(inferConversationTitle('New chat', 'x'.repeat(80), 'New chat')).toBe(
      'x'.repeat(50),
    );
  });

  it('falls back to the default title for empty content', () => {
    expect(inferConversationTitle('New chat', '', 'New chat')).toBe('New chat');
  });
});
