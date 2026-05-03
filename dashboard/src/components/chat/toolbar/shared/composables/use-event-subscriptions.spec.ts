import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { subscriptions } from './subscriptions.state';
import { useEventSubscriptions } from './use-event-subscriptions';

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
    expect(subscriptions.value.length).toBe(1);
    expect(subscriptions.value[0].event).toBe('harness');
    expect(subscriptions.value[0].roomId).toBe('room1');
    expect(subscriptions.value[0].active).toBe(true);
    expect(subscriptions.value[0].stream).toBe(true);
  });

  it('subscribeToEvent does not add duplicate', () => {
    const { subscriptions, subscribeToEvent } = useEventSubscriptions();
    subscribeToEvent('harness', 'room1');
    subscribeToEvent('harness', 'room1');
    expect(subscriptions.value.length).toBe(1);
  });

  it('subscribeToEvent ignores empty event', () => {
    const { subscriptions, subscribeToEvent } = useEventSubscriptions();
    subscribeToEvent('', '');
    expect(subscriptions.value.length).toBe(0);
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

  it('removeSubscription removes the entry', () => {
    const { subscriptions, subscribeToEvent, removeSubscription } =
      useEventSubscriptions();
    subscribeToEvent('harness', 'room1');
    subscribeToEvent('debug', '');
    removeSubscription(0);
    expect(subscriptions.value.length).toBe(1);
    expect(subscriptions.value[0].event).toBe('debug');
  });

  it('availableSocketBindings returns sorted unique active binding strings', () => {
    const { availableSocketBindings, subscribeToEvent } =
      useEventSubscriptions();
    subscribeToEvent('beta', '');
    subscribeToEvent('alpha', 'room1');
    expect(availableSocketBindings.value).toEqual(['alpha::room1', 'beta']);
  });

  it('reactively adds new conversation subscriptions without remounting', async () => {
    const conversationStore = useConversationStore();
    const { subscriptions } = useEventSubscriptions();
    expect(subscriptions.value.length).toBe(0);

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
