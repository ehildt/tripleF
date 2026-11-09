import { beforeEach, describe, expect, it } from 'vitest';

import { useConversationSession } from './use-conversation-session';

describe('useConversationSession', () => {
  beforeEach(() => useConversationSession().setActiveConversationId(null));

  it('shares active conversation control across callers', () => {
    const navigation = useConversationSession();
    const chat = useConversationSession();
    expect(navigation.activeConversationId.value).toBeNull();

    navigation.setActiveConversationId('c1');
    expect(chat.activeConversationId.value).toBe('c1');

    chat.setActiveConversationId(null);
    expect(navigation.activeConversationId.value).toBeNull();
  });
});
