import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/conversation';
import { inMemoryTemporaryConversationsTable } from '@/test-utils/in-memory-temporary-conversations';

import { useSocketStore } from '../../../../../stores/socket';
import { subscriptions } from './subscriptions.state';
import { useConversationList } from './use-conversation-list';

vi.mock('../../../../../api/conversations.api', () => ({
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../../stores/socket', () => {
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

describe('useConversationList', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    inMemoryTemporaryConversationsTable.clear();
    subscriptions.value = [];
    vi.clearAllMocks();
    // The conversation store hydrates persisted conversations asynchronously
    // on creation — settle before seeding, or the load result would wipe
    // conversations seeded mid-test.
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('starts with isConversationListExpanded from localStorage', () => {
    localStorage.setItem('harness-expanded-conversations', 'true');
    const { isConversationListExpanded } = useConversationList();
    expect(isConversationListExpanded.value).toBe(true);
  });

  it('defaults isConversationListExpanded to false', () => {
    const { isConversationListExpanded } = useConversationList();
    expect(isConversationListExpanded.value).toBe(false);
  });

  it('exposes newConversationName, newConversationEvent, and newConversationRoomId refs', () => {
    const { newConversationName, newConversationEvent, newConversationRoomId } =
      useConversationList();
    expect(newConversationName.value).toBe('');
    expect(newConversationEvent.value).toBe('');
    expect(newConversationRoomId.value).toBe('');
  });

  it('conversationsSortedByUpdated returns conversations sorted by updatedAt desc', () => {
    const conversationStore = useConversationStore();
    conversationStore.createNewConversation('temporary');
    conversationStore.createNewConversation('temporary');

    const { conversationsSortedByUpdated } = useConversationList();
    const sorted = conversationsSortedByUpdated.value;
    expect(sorted.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].updatedAt).toBeGreaterThanOrEqual(
        sorted[i].updatedAt,
      );
    }
  });

  it('switchToConversation sets active conversation', () => {
    const conversationStore = useConversationStore();
    const s1 = conversationStore.ensureConversation();
    const s2 = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(s1.id);

    const { switchToConversation } = useConversationList();
    switchToConversation(s2.id);
    expect(conversationStore.activeConversationId).toBe(s2.id);
  });

  it('deleteConversation removes the conversation', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    const lenBefore = conversationStore.conversations.length;

    const { deleteConversation } = useConversationList();
    await deleteConversation(conversation.id);
    expect(conversationStore.conversations).toHaveLength(lenBefore - 1);
  });

  it('deleteConversation leaves rooms and removes matching subscriptions', async () => {
    const conversationStore = useConversationStore();
    const socketStore = useSocketStore();

    subscriptions.value = [
      { event: 'harness', roomId: 'room1', active: true, stream: true },
      { event: 'other', roomId: 'room2', active: true, stream: true },
    ];

    const { createNewConversation, deleteConversation } = useConversationList();
    createNewConversation('temporary', 'Conv', 'harness', 'room1');
    const conversation = conversationStore.conversations[0]!;

    await deleteConversation(conversation.id);

    expect(socketStore.closeRoom).toHaveBeenCalledWith('harness', 'room1');
    expect(socketStore.closeEvent).toHaveBeenCalledWith('harness');
    expect(subscriptions.value).not.toContainEqual(
      expect.objectContaining({ event: 'harness', roomId: 'room1' }),
    );
    expect(subscriptions.value).toContainEqual(
      expect.objectContaining({ event: 'other', roomId: 'room2' }),
    );
  });

  it('deleteConversation keeps the event alive when another conversation still uses it', async () => {
    const conversationStore = useConversationStore();
    const socketStore = useSocketStore();

    const { createNewConversation, deleteConversation } = useConversationList();
    createNewConversation('temporary', 'First', 'harness', 'room1');
    createNewConversation('temporary', 'Second', 'harness', 'room2');
    const first = conversationStore.conversations.find(
      (c) => c.title === 'First',
    )!;

    await deleteConversation(first.id);

    expect(socketStore.closeRoom).toHaveBeenCalledWith('harness', 'room1');
    expect(socketStore.closeEvent).not.toHaveBeenCalledWith('harness');
  });

  it('createNewConversation creates a conversation and clears form', () => {
    const conversationStore = useConversationStore();
    const lenBefore = conversationStore.conversations.length;

    const {
      createNewConversation,
      newConversationName,
      newConversationEvent,
      newConversationRoomId,
    } = useConversationList();
    newConversationName.value = 'My Conversation';
    createNewConversation('temporary', 'My Conversation', 'harness', 'room1');

    expect(conversationStore.conversations.length).toBeGreaterThan(lenBefore);
    expect(newConversationName.value).toBe('');
    expect(newConversationEvent.value).toBe('');
    expect(newConversationRoomId.value).toBe('');
  });

  it('createNewConversation inherits the matched socket stream mode', () => {
    const conversationStore = useConversationStore();
    subscriptions.value = [
      { event: 'harness', roomId: 'room1', active: true, stream: false },
    ];

    const { createNewConversation } = useConversationList();
    createNewConversation('temporary', 'Conv', 'harness', 'room1');

    const conversation = conversationStore.conversations[0]!;
    expect(conversation.stream).toBe(false);
  });

  it('createNewConversation keeps default stream when no socket matches', () => {
    const conversationStore = useConversationStore();
    subscriptions.value = [];

    const { createNewConversation } = useConversationList();
    createNewConversation('temporary', 'Conv', 'harness', 'room1');

    expect(conversationStore.conversations[0]!.stream).toBe(true);
  });
});
