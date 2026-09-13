import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';
import { useModelsStore } from '@/stores/models';
import { inMemoryTemporaryConversationsTable } from '@/test-utils/in-memory-temporary-conversations';

import { subscriptions } from '../../shared/composables/subscriptions.state';
import { useConversationMenu } from './use-conversation-menu';

vi.mock('@/api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/stores/socket', () => {
  const ensureSocketConnection = vi.fn();
  const listenToEvent = vi.fn();
  const joinRoom = vi.fn();
  const leaveRoom = vi.fn();
  const closeEvent = vi.fn();
  const closeRoom = vi.fn();

  return {
    useSocketStore: () => ({
      connectedPairs: [],
      connectionState: 'disconnected',
      socketId: null,
      ensureSocketConnection,
      listenToEvent,
      joinRoom,
      leaveRoom,
      closeEvent,
      closeRoom,
    }),
  };
});

describe('useConversationMenu', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    inMemoryTemporaryConversationsTable.clear();
    subscriptions.value = [];
    vi.clearAllMocks();
    useConversationStore();
    useModelsStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('starts with empty draft form refs', () => {
    const { newConversationName, newConversationEvent, newConversationRoomId } =
      useConversationMenu();
    expect(newConversationName.value).toBe('');
    expect(newConversationEvent.value).toBe('');
    expect(newConversationRoomId.value).toBe('');
  });

  it('reports hasNoModelSelected when no model is selected', () => {
    const { hasNoModelSelected } = useConversationMenu();
    expect(hasNoModelSelected.value).toBe(true);
  });

  it('exposes active socket events as options', () => {
    subscriptions.value = [
      { event: 'harness', roomId: 'room1', active: true, stream: true },
      { event: 'updates', roomId: '', active: true, stream: true },
      { event: 'disabled', roomId: '', active: false, stream: true },
    ];

    const { availableSocketEvents } = useConversationMenu();
    expect(availableSocketEvents.value).toEqual(['harness', 'updates']);
  });

  it('exposes rooms for the selected socket event', () => {
    subscriptions.value = [
      { event: 'harness', roomId: 'room1', active: true, stream: true },
      { event: 'harness', roomId: 'room2', active: true, stream: true },
      { event: 'other', roomId: 'room3', active: true, stream: true },
    ];

    const { availableRooms, newConversationEvent } = useConversationMenu();
    newConversationEvent.value = 'harness';
    expect(availableRooms.value).toEqual(['room1', 'room2']);
  });

  it('createConversation creates a conversation and clears the form', () => {
    const conversationStore = useConversationStore();
    const lenBefore = conversationStore.conversations.length;

    const {
      createConversation,
      newConversationName,
      newConversationEvent,
      newConversationRoomId,
    } = useConversationMenu();
    newConversationName.value = 'My Conversation';
    newConversationEvent.value = 'harness';
    newConversationRoomId.value = 'room1';

    createConversation('temporary');

    expect(conversationStore.conversations.length).toBeGreaterThan(lenBefore);
    expect(newConversationName.value).toBe('');
    expect(newConversationEvent.value).toBe('');
    expect(newConversationRoomId.value).toBe('');
  });

  it('createConversation inherits the matched socket stream mode', () => {
    const conversationStore = useConversationStore();
    subscriptions.value = [
      { event: 'harness', roomId: 'room1', active: true, stream: false },
    ];

    const { createConversation, newConversationEvent, newConversationRoomId } =
      useConversationMenu();
    newConversationEvent.value = 'harness';
    newConversationRoomId.value = 'room1';

    createConversation('temporary');

    expect(conversationStore.conversations[0]!.stream).toBe(false);
  });

  it('createConversation keeps default stream when no socket matches', () => {
    const conversationStore = useConversationStore();
    subscriptions.value = [];

    const { createConversation } = useConversationMenu();
    createConversation('temporary');

    expect(conversationStore.conversations[0]!.stream).toBe(true);
  });
});
