import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useSocketStore } from '../../../../../stores/socket';
import { subscriptions } from './subscriptions.state';
import { useEventSubscriptions } from './use-event-subscriptions';

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

describe('useEventSubscriptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    subscriptions.value = [];
    vi.clearAllMocks();
  });

  it('starts with empty subscriptions when nothing in localStorage', () => {
    const { subscriptions } = useEventSubscriptions();
    expect(subscriptions.value).toEqual([]);
  });

  it('isSubscriptionListExpanded defaults from localStorage', () => {
    localStorage.setItem('harness-expanded-sockets', 'true');
    const { isSubscriptionListExpanded } = useEventSubscriptions();
    expect(isSubscriptionListExpanded.value).toBe(true);
  });

  it('subscribeToEvent adds a new subscription', () => {
    const { subscriptions, subscribeToEvent } = useEventSubscriptions();
    subscribeToEvent('harness', 'room1');
    expect(subscriptions.value).toHaveLength(1);
    expect(subscriptions.value[0].event).toBe('harness');
    expect(subscriptions.value[0].roomId).toBe('room1');
    expect(subscriptions.value[0].active).toBe(true);
    expect(subscriptions.value[0].stream).toBe(true);
  });

  it('subscribeToEvent does not add duplicate', () => {
    const { subscriptions, subscribeToEvent } = useEventSubscriptions();
    subscribeToEvent('harness', 'room1');
    subscribeToEvent('harness', 'room1');
    expect(subscriptions.value).toHaveLength(1);
  });

  it('subscribeToEvent ignores empty event', () => {
    const { subscriptions, subscribeToEvent } = useEventSubscriptions();
    subscribeToEvent('', '');
    expect(subscriptions.value).toHaveLength(0);
  });

  it('toggleSubscriptionActive deactivates an active subscription', () => {
    const { subscriptions, subscribeToEvent, toggleSubscriptionActive } =
      useEventSubscriptions();
    subscribeToEvent('harness', 'room1');
    toggleSubscriptionActive(0);
    expect(subscriptions.value[0].active).toBe(false);
  });

  it('toggleSubscriptionActive reactivates an inactive subscription', () => {
    const { subscriptions, subscribeToEvent, toggleSubscriptionActive } =
      useEventSubscriptions();
    subscribeToEvent('harness', 'room1');
    toggleSubscriptionActive(0);
    toggleSubscriptionActive(0);
    expect(subscriptions.value[0].active).toBe(true);
  });

  it('toggleSubscriptionStream flips stream flag', () => {
    const { subscriptions, subscribeToEvent, toggleSubscriptionStream } =
      useEventSubscriptions();
    subscribeToEvent('harness', '');
    expect(subscriptions.value[0].stream).toBe(true);
    toggleSubscriptionStream(0);
    expect(subscriptions.value[0].stream).toBe(false);
    toggleSubscriptionStream(0);
    expect(subscriptions.value[0].stream).toBe(true);
  });

  it('subscribeToEvent keeps the provided stream mode', () => {
    const { subscriptions, subscribeToEvent } = useEventSubscriptions();
    subscribeToEvent('harness', 'room1', false);
    expect(subscriptions.value[0].stream).toBe(false);
  });

  it('toggleSubscriptionStream syncs stream onto bound conversations', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.createNewConversation(
      'temporary',
      'harness',
      'room1',
    );

    const { subscriptions, subscribeToEvent, toggleSubscriptionStream } =
      useEventSubscriptions();
    subscribeToEvent('harness', 'room1');

    expect(conversation.stream).toBe(true);
    toggleSubscriptionStream(0);
    expect(subscriptions.value[0].stream).toBe(false);
    expect(conversationStore.getConversation(conversation.id)?.stream).toBe(
      false,
    );
  });

  it('toggleSubscriptionStream syncs stream onto conversations via extra subscriptions', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setSubscriptions(conversation.id, [
      { event: 'shared', roomId: 'room1' },
    ]);

    const { subscribeToEvent, toggleSubscriptionStream } =
      useEventSubscriptions();
    subscribeToEvent('shared', 'room1');
    expect(conversationStore.getConversation(conversation.id)?.stream).toBe(
      true,
    );

    toggleSubscriptionStream(0);
    expect(conversationStore.getConversation(conversation.id)?.stream).toBe(
      false,
    );
  });

  it('removeSubscription removes the entry', () => {
    const { subscriptions, subscribeToEvent, removeSubscription } =
      useEventSubscriptions();
    subscribeToEvent('harness', 'room1');
    subscribeToEvent('debug', '');
    removeSubscription(0);
    expect(subscriptions.value).toHaveLength(1);
    expect(subscriptions.value[0].event).toBe('debug');
  });

  it('availableSocketEvents returns sorted unique active events', () => {
    const { availableSocketEvents, subscribeToEvent } = useEventSubscriptions();
    subscribeToEvent('beta', '');
    subscribeToEvent('alpha', 'room1');
    subscribeToEvent('alpha', 'room2');
    expect(availableSocketEvents.value).toEqual(['alpha', 'beta']);
  });

  it('availableRoomsByEvent groups sorted unique roomIds per event', () => {
    const { availableRoomsByEvent, subscribeToEvent } = useEventSubscriptions();
    subscribeToEvent('alpha', 'room2');
    subscribeToEvent('alpha', 'room1');
    subscribeToEvent('beta', 'room9');
    subscribeToEvent('beta', '');
    expect(availableRoomsByEvent.value).toEqual({
      alpha: ['room1', 'room2'],
      beta: ['room9'],
    });
  });

  it('pruneUnreferencedSubscriptions removes sockets no conversation references', () => {
    const conversationStore = useConversationStore();
    const socketStore = useSocketStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setSubscriptions(conversation.id, [
      { event: 'keep', roomId: 'room1' },
    ]);

    subscriptions.value = [
      { event: 'keep', roomId: 'room1', active: true, stream: true },
      { event: 'stale', roomId: 'room2', active: true, stream: true },
      { event: 'stale', roomId: '', active: true, stream: true },
    ];

    const { pruneUnreferencedSubscriptions } = useEventSubscriptions();
    pruneUnreferencedSubscriptions();

    expect(subscriptions.value).toEqual([
      { event: 'keep', roomId: 'room1', active: true, stream: true },
    ]);
    expect(socketStore.closeRoom).toHaveBeenCalledWith('stale', 'room2');
    expect(socketStore.closeEvent).toHaveBeenCalledWith('stale');
    expect(socketStore.closeEvent).not.toHaveBeenCalledWith('keep');
  });

  it('pruneUnreferencedSubscriptions keeps the event alive while another room uses it', () => {
    const conversationStore = useConversationStore();
    const socketStore = useSocketStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setSubscriptions(conversation.id, [
      { event: 'shared', roomId: 'room2' },
    ]);

    subscriptions.value = [
      { event: 'shared', roomId: 'room1', active: true, stream: true },
      { event: 'shared', roomId: 'room2', active: true, stream: true },
    ];

    const { pruneUnreferencedSubscriptions } = useEventSubscriptions();
    pruneUnreferencedSubscriptions();

    expect(subscriptions.value).toEqual([
      { event: 'shared', roomId: 'room2', active: true, stream: true },
    ]);
    expect(socketStore.closeRoom).toHaveBeenCalledWith('shared', 'room1');
    expect(socketStore.closeEvent).not.toHaveBeenCalledWith('shared');
  });

  it('prunes subscriptions when a conversation is deleted', async () => {
    const conversationStore = useConversationStore();
    useEventSubscriptions();

    // Let the store's initial async hydration settle first, otherwise it
    // resolves to the mocked empty list and wipes the conversation created
    // below before it can be deleted.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const conversation = conversationStore.createNewConversation(
      'temporary',
      'gone',
      'gone-room',
    );
    // Mark it loaded so deleteCurrentConversation can act on it synchronously
    // instead of trying to hydrate a stub from the (mocked) server.
    conversation.loaded = true;
    await nextTick();
    subscriptions.value.push({
      event: 'orphan',
      roomId: 'x',
      active: true,
      stream: true,
    });

    await conversationStore.deleteCurrentConversation(conversation.id);
    await nextTick();

    expect(subscriptions.value.some((sub) => sub.event === 'orphan')).toBe(
      false,
    );
    expect(subscriptions.value.some((sub) => sub.event === 'gone')).toBe(false);
  });

  it('reactively adds new conversation subscriptions without remounting', async () => {
    const conversationStore = useConversationStore();
    const { subscriptions } = useEventSubscriptions();
    expect(subscriptions.value).toHaveLength(0);

    conversationStore.createNewConversation(
      'temporary',
      'runtime-event',
      'runtime-room',
    );
    await nextTick();

    expect(
      subscriptions.value.some(
        (sub) => sub.event === 'runtime-event' && sub.roomId === 'runtime-room',
      ),
    ).toBe(true);
  });

  it('mergeSubscriptionsFromSessions adds conversation events', () => {
    const conversationStore = useConversationStore();
    const s = conversationStore.ensureConversation();
    conversationStore.setSubscriptions(s.id, [
      { event: 'from-conversation', roomId: '' },
    ]);

    const { subscriptions, mergeSubscriptionsFromSessions } =
      useEventSubscriptions();
    mergeSubscriptionsFromSessions();
    expect(
      subscriptions.value.some(
        (sub) => sub.event === 'from-conversation' && sub.roomId === '',
      ),
    ).toBe(true);
  });
});
