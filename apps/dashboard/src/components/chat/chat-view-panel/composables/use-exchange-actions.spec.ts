import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';

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

      const { retryExchange } = useExchangeActions();

      retryExchange(assistantId);

      expect(submit).toHaveBeenCalledWith('Hi there');
    });
  });
});
