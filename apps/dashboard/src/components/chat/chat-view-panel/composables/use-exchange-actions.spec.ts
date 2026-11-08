import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';

import { useExchangeActions } from './use-exchange-actions';

const submit = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('@/components/chat/composables/use-submit', () => ({
  useSubmit: () => ({ submit }),
}));

describe('useExchangeActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    submit.mockClear();
  });

  describe('retryExchange', () => {
    it('does nothing when no conversation is active', () => {
      const { retryExchange } = useExchangeActions();

      retryExchange('any-id');

      expect(submit).not.toHaveBeenCalled();
    });

    it('replays the user message via the submit action', () => {
      const conversationStore = useConversationStore();
      const conversation = useConversationCatalog().createNewConversation();
      conversationStore.addExchange(
        conversation.id,
        {
          role: 'user',
          content: 'Hi there',
          status: 'done',
        },
        'New chat',
      );
      conversationStore.addExchange(
        conversation.id,
        {
          role: 'assistant',
          content: 'Hello back',
          status: 'done',
        },
        'New chat',
      );
      const assistantId = conversation.exchanges[1].id;

      const { retryExchange } = useExchangeActions();

      retryExchange(assistantId);

      expect(submit).toHaveBeenCalledWith('Hi there');
    });
  });
});
