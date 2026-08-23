import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';

import { useExchangeActions } from './use-exchange-actions';

describe('useExchangeActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('retryExchange', () => {
    it('does nothing when no conversation is active', () => {
      const retryHandler = vi.fn(async () => undefined);
      const { retryExchange } = useExchangeActions(retryHandler);

      retryExchange('any-id');

      expect(retryHandler).not.toHaveBeenCalled();
    });

    it('replays the user message via retryHandler', () => {
      const conversationStore = useConversationStore();
      const conversation = conversationStore.ensureConversation();
      conversationStore.addExchange(conversation.id, {
        role: 'user',
        content: 'Hi there',
        status: 'done',
      });
      conversationStore.addExchange(conversation.id, {
        role: 'assistant',
        content: 'Hello back',
        status: 'done',
      });
      const assistantId = conversation.exchanges[1].id;

      const retryHandler = vi.fn(async () => undefined);
      const { retryExchange } = useExchangeActions(retryHandler);

      retryExchange(assistantId);

      expect(retryHandler).toHaveBeenCalledWith('Hi there');
    });
  });
});
