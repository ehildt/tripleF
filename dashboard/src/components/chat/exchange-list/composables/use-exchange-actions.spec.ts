import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => {
  const mockSocket = {
    connected: true,
    id: 'socket-123',
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
  };
  return {
    io: vi.fn(() => mockSocket),
  };
});

import { useConversationStore } from '@/stores/conversation';

import { useSocketStore } from '../../../../stores/socket';
import { useExchangeActions } from './use-exchange-actions';

describe('useExchangeActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('deleteExchange', () => {
    it('does nothing when no conversation is active', () => {
      const conversationStore = useConversationStore();
      const { deleteExchange } = useExchangeActions(vi.fn());

      deleteExchange('any-id');

      expect(conversationStore.activeConversationId).toBeNull();
    });

    it('prunes the exchange and its assistant partner from the active conversation', () => {
      const conversationStore = useConversationStore();
      const conversation = conversationStore.ensureConversation();
      conversationStore.addExchange(conversation.id, {
        role: 'user',
        content: 'Hi',
        status: 'done',
      });
      const userId = conversation.exchanges[0].id;
      conversationStore.addExchange(conversation.id, {
        role: 'assistant',
        content: 'Hello',
        status: 'done',
      });
      expect(conversation.exchanges).toHaveLength(2);

      const { deleteExchange } = useExchangeActions(vi.fn());
      deleteExchange(userId);

      expect(conversation.exchanges).toHaveLength(0);
    });
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

  describe('branchExchange', () => {
    it('creates a new temporary conversation with the branched exchanges', () => {
      const conversationStore = useConversationStore();
      const conversation = conversationStore.ensureConversation();
      conversationStore.addExchange(conversation.id, {
        role: 'user',
        content: 'Branch point',
        status: 'done',
      });
      conversationStore.addExchange(conversation.id, {
        role: 'assistant',
        content: 'Branch reply',
        status: 'done',
      });
      const userId = conversation.exchanges[0].id;
      const conversationsBefore = conversationStore.conversations.length;

      const { branchExchange } = useExchangeActions(vi.fn());
      branchExchange(userId);

      expect(conversationStore.conversations.length).toBe(
        conversationsBefore + 1,
      );
      const branched = conversationStore.conversations[0];
      expect(branched.id).not.toBe(conversation.id);
      expect(branched.exchanges).toHaveLength(2);
      expect(branched.exchanges[0].content).toBe('Branch point');
      expect(branched.exchanges[1].content).toBe('Branch reply');
    });

    it('connects the socket for the branched conversation', () => {
      const conversationStore = useConversationStore();
      const socketStore = useSocketStore();
      const conversation = conversationStore.ensureConversation();
      conversationStore.addExchange(conversation.id, {
        role: 'user',
        content: 'Branch point',
        status: 'done',
      });
      conversationStore.addExchange(conversation.id, {
        role: 'assistant',
        content: 'Branch reply',
        status: 'done',
      });
      const userId = conversation.exchanges[0].id;

      const { branchExchange } = useExchangeActions(vi.fn());
      branchExchange(userId);

      const branched = conversationStore.conversations[0];
      expect(socketStore.connectedEvents.has(branched.event)).toBe(true);
    });
  });
});
