import { describe, expect, it } from 'vitest';

import { isConversationBoundToSocket } from './is-conversation-bound-to-socket.helper';

describe('isConversationBoundToSocket', () => {
  it('matches the conversation own event/room binding', () => {
    const conversation = { event: 'e', roomId: 'r' };
    expect(isConversationBoundToSocket(conversation, 'e', 'r')).toBe(true);
  });

  it('treats an unset room as the empty room', () => {
    const conversation = { event: 'e' };
    expect(isConversationBoundToSocket(conversation, 'e', '')).toBe(true);
  });

  it('matches an extra subscription', () => {
    const conversation = { subscriptions: [{ event: 'e', roomId: 'r' }] };
    expect(isConversationBoundToSocket(conversation, 'e', 'r')).toBe(true);
  });

  it('rejects a different event or room', () => {
    const conversation = { event: 'e', roomId: 'r' };
    expect(isConversationBoundToSocket(conversation, 'e', 'other')).toBe(false);
    expect(isConversationBoundToSocket(conversation, 'other', 'r')).toBe(false);
  });

  it('rejects a conversation with no bindings', () => {
    expect(isConversationBoundToSocket({}, 'e', 'r')).toBe(false);
  });
});
