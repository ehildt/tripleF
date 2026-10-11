import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref } from 'vue';

import type { Conversation } from '@/stores/conversation';
import type { SubscriptionEntry } from '@/types/subscription.model';

import { useDeleteConversation } from './use-delete-conversation';

const state = vi.hoisted(() => ({
  conversation: undefined as unknown as {
    conversations: Conversation[];
    getConversation: ReturnType<typeof vi.fn>;
    setSubscriptions: ReturnType<typeof vi.fn>;
    deleteCurrentConversation: ReturnType<typeof vi.fn>;
  },
  subscriptions: undefined as unknown as Ref<SubscriptionEntry[]>,
  getConversation: vi.fn(),
  setSubscriptions: vi.fn(),
  deleteCurrentConversation: vi.fn(),
  removeSubscriptionByEventRoom: vi.fn(),
  closeRoom: vi.fn(),
  closeEvent: vi.fn(),
}));

vi.mock('@/stores/conversation', async () => {
  const { reactive } = await import('vue');
  const store = reactive({
    conversations: [] as Conversation[],
    getConversation: state.getConversation,
    setSubscriptions: state.setSubscriptions,
    deleteCurrentConversation: state.deleteCurrentConversation,
  });
  state.conversation = store;
  return { useConversationStore: () => store };
});

vi.mock('@/stores/socket', () => ({
  useSocketStore: () => ({
    closeRoom: state.closeRoom,
    closeEvent: state.closeEvent,
  }),
}));

vi.mock('./use-socket-subscriptions', async () => {
  const { ref } = await import('vue');
  const subscriptions = ref<SubscriptionEntry[]>([]);
  state.subscriptions = subscriptions;
  const removeSubscriptionByEventRoom = vi.fn(
    (event: string, roomId: string) => {
      const index = subscriptions.value.findIndex(
        (s) => s.event === event && s.roomId === roomId,
      );
      if (index !== -1) subscriptions.value.splice(index, 1);
    },
  );
  state.removeSubscriptionByEventRoom = removeSubscriptionByEventRoom;
  return {
    useSocketSubscriptions: () => ({
      subscriptions,
      removeSubscriptionByEventRoom,
    }),
  };
});

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

describe('useDeleteConversation', () => {
  beforeEach(() => {
    state.conversation.conversations = [];
    state.subscriptions.value = [];
    state.getConversation.mockReset();
    state.setSubscriptions.mockClear();
    state.deleteCurrentConversation.mockClear();
    state.deleteCurrentConversation.mockResolvedValue(undefined);
    state.removeSubscriptionByEventRoom.mockClear();
    state.closeRoom.mockClear();
    state.closeEvent.mockClear();
  });

  it('closes the room and event, clears subscriptions, and deletes', async () => {
    const target = conversation({ event: 'e', roomId: 'r' });
    state.getConversation.mockReturnValue(target);
    state.conversation.conversations = [target];
    state.subscriptions.value = [
      { event: 'e', roomId: 'r', active: true, stream: true },
    ];

    const { deleteConversation } = useDeleteConversation();
    await deleteConversation('c1');

    expect(state.closeRoom).toHaveBeenCalledWith('e', 'r');
    expect(state.closeEvent).toHaveBeenCalledWith('e');
    expect(state.setSubscriptions).toHaveBeenCalledWith('c1', []);
    expect(state.deleteCurrentConversation).toHaveBeenCalledWith('c1');
  });

  it('keeps a socket shared with another conversation', async () => {
    const target = conversation({ event: 'e', roomId: 'r' });
    const sharer = conversation({ id: 'c2', event: 'e', roomId: 'r' });
    state.getConversation.mockReturnValue(target);
    state.conversation.conversations = [target, sharer];

    const { deleteConversation } = useDeleteConversation();
    await deleteConversation('c1');

    expect(state.closeRoom).not.toHaveBeenCalled();
    expect(state.closeEvent).not.toHaveBeenCalled();
    expect(state.deleteCurrentConversation).toHaveBeenCalledWith('c1');
  });

  it('does nothing for an unknown conversation', async () => {
    state.getConversation.mockReturnValue(undefined);

    const { deleteConversation } = useDeleteConversation();
    await deleteConversation('missing');

    expect(state.deleteCurrentConversation).not.toHaveBeenCalled();
  });
});
