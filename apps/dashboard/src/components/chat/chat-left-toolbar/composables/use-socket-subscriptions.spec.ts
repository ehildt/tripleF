import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import type { Conversation } from '@/stores/conversation';
import type { SubscriptionEntry } from '@/types/subscription.model';

const state = vi.hoisted(() => ({
  conversation: undefined as unknown as {
    conversations: Conversation[];
    hydrated: boolean;
    setStream: ReturnType<typeof vi.fn>;
  },
  setStream: vi.fn(),
  ensureSocketConnection: vi.fn(),
  listenToEvent: vi.fn(),
  joinRoom: vi.fn(),
  closeRoom: vi.fn(),
  closeEvent: vi.fn(),
}));

vi.mock('@/stores/conversation', async () => {
  const { reactive } = await import('vue');
  const store = reactive({
    conversations: [] as Conversation[],
    hydrated: false,
    setStream: state.setStream,
  });
  state.conversation = store;
  return { useConversationStore: () => store };
});

vi.mock('@/stores/socket', () => ({
  useSocketStore: () => ({
    ensureSocketConnection: state.ensureSocketConnection,
    listenToEvent: state.listenToEvent,
    joinRoom: state.joinRoom,
    closeRoom: state.closeRoom,
    closeEvent: state.closeEvent,
  }),
}));

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    title: 'Chat',
    event: '',
    roomId: '',
    stream: true,
    subscriptions: [],
    ...overrides,
  } as Conversation;
}

describe('useSocketSubscriptions', () => {
  let useSocketSubscriptions: typeof import('./use-socket-subscriptions').useSocketSubscriptions;

  beforeEach(async () => {
    localStorage.clear();
    // Fresh module per test: the registry's subscriptions ref and its
    // one-time lifecycle watchers are module-scope singletons.
    vi.resetModules();
    const mod = await import('./use-socket-subscriptions');
    useSocketSubscriptions = mod.useSocketSubscriptions;

    state.setStream.mockClear();
    state.ensureSocketConnection.mockClear();
    state.listenToEvent.mockClear();
    state.joinRoom.mockClear();
    state.closeRoom.mockClear();
    state.closeEvent.mockClear();

    state.conversation.conversations = [];
    state.conversation.hydrated = false;
  });

  it('subscribeToEvent connects, listens, joins, and records the subscription', () => {
    const { subscribeToEvent, subscriptions } = useSocketSubscriptions();
    subscribeToEvent('  e  ', 'r');

    expect(state.ensureSocketConnection).toHaveBeenCalled();
    expect(state.listenToEvent).toHaveBeenCalledWith('e');
    expect(state.joinRoom).toHaveBeenCalledWith('r', 'e');
    expect(subscriptions.value).toEqual([
      { event: 'e', roomId: 'r', active: true, stream: true },
    ]);
  });

  it('subscribeToEvent ignores a blank event', () => {
    const { subscribeToEvent, subscriptions } = useSocketSubscriptions();
    subscribeToEvent('   ', 'r');

    expect(subscriptions.value).toEqual([]);
    expect(state.listenToEvent).not.toHaveBeenCalled();
  });

  it('persists subscriptions to localStorage', async () => {
    const { subscribeToEvent } = useSocketSubscriptions();
    subscribeToEvent('e', '');

    await nextTick();

    const stored = JSON.parse(
      localStorage.getItem('harness-subscriptions') ?? '[]',
    ) as SubscriptionEntry[];
    expect(stored).toEqual([
      { event: 'e', roomId: '', active: true, stream: true },
    ]);
  });

  it('toggleSubscriptionActive closes the room when deactivating', () => {
    const { subscribeToEvent, toggleSubscriptionActive } =
      useSocketSubscriptions();
    subscribeToEvent('e', 'r');
    state.closeRoom.mockClear();

    toggleSubscriptionActive(0);

    expect(state.closeRoom).toHaveBeenCalledWith('e', 'r');
  });

  it('toggleSubscriptionStream flips and pushes the mode onto bound conversations', () => {
    const { subscribeToEvent, toggleSubscriptionStream } =
      useSocketSubscriptions();
    subscribeToEvent('e', 'r');
    state.conversation.conversations = [
      conversation({ event: 'e', roomId: 'r', stream: true }),
    ];

    toggleSubscriptionStream(0);

    expect(state.setStream).toHaveBeenCalledWith('c1', false);
  });

  it('removeSubscription closes the room only when active and removes the entry', () => {
    const { subscribeToEvent, removeSubscription, subscriptions } =
      useSocketSubscriptions();
    subscribeToEvent('e', 'r');
    state.closeRoom.mockClear();

    removeSubscription(0);

    expect(state.closeRoom).toHaveBeenCalledWith('e', 'r');
    expect(subscriptions.value).toEqual([]);
  });

  it('merges conversation bindings on hydration', async () => {
    state.conversation.conversations = [
      conversation({ event: 'e', roomId: 'r' }),
    ];
    const { subscriptions } = useSocketSubscriptions();
    state.conversation.hydrated = true;

    await nextTick();

    expect(subscriptions.value).toEqual([
      { event: 'e', roomId: 'r', active: true, stream: true },
    ]);
  });

  it('prunes an unreferenced subscription and closes its event', async () => {
    const { subscriptions } = useSocketSubscriptions();
    state.conversation.conversations = [
      conversation({ event: 'e', roomId: 'r' }),
    ];
    state.conversation.hydrated = true;
    await nextTick();

    state.closeRoom.mockClear();
    state.closeEvent.mockClear();
    state.conversation.conversations = [];
    await nextTick();

    expect(subscriptions.value).toEqual([]);
    expect(state.closeRoom).toHaveBeenCalledWith('e', 'r');
    expect(state.closeEvent).toHaveBeenCalledWith('e');
  });
});
