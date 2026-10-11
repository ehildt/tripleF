import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref } from 'vue';

import type { SubscriptionEntry } from '@/types/subscription.model';

import { useNewConversationForm } from './use-new-conversation-form';

const state = vi.hoisted(() => ({
  conversation: undefined as unknown as {
    activeConversationId: string;
    createNewConversation: ReturnType<typeof vi.fn>;
    renameConversation: ReturnType<typeof vi.fn>;
    setSubscriptions: ReturnType<typeof vi.fn>;
    setStream: ReturnType<typeof vi.fn>;
  },
  subscriptions: undefined as unknown as Ref<SubscriptionEntry[]>,
  createNewConversation: vi.fn(),
  renameConversation: vi.fn(),
  setSubscriptions: vi.fn(),
  setStream: vi.fn(),
  ensureSocketConnection: vi.fn(),
  listenToEvent: vi.fn(),
  joinRoom: vi.fn(),
}));

vi.mock('@/stores/conversation', async () => {
  const { reactive } = await import('vue');
  const store = reactive({
    activeConversationId: '',
    createNewConversation: state.createNewConversation,
    renameConversation: state.renameConversation,
    setSubscriptions: state.setSubscriptions,
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
  }),
}));

vi.mock('./use-socket-subscriptions', async () => {
  const { ref } = await import('vue');
  const subscriptions = ref<SubscriptionEntry[]>([]);
  state.subscriptions = subscriptions;
  return { useSocketSubscriptions: () => ({ subscriptions }) };
});

describe('useNewConversationForm', () => {
  beforeEach(() => {
    state.conversation.activeConversationId = 'conv-1';
    state.subscriptions.value = [];
    state.createNewConversation.mockClear();
    state.renameConversation.mockClear();
    state.setSubscriptions.mockClear();
    state.setStream.mockClear();
    state.ensureSocketConnection.mockClear();
    state.listenToEvent.mockClear();
    state.joinRoom.mockClear();
  });

  it('wires the socket, creates the conversation, and clears the form', () => {
    const {
      newConversationName,
      newConversationEvent,
      newConversationRoomId,
      createConversation,
    } = useNewConversationForm();

    newConversationName.value = 'My Chat';
    newConversationEvent.value = 'e';
    newConversationRoomId.value = 'r';

    createConversation('temporary');

    expect(state.ensureSocketConnection).toHaveBeenCalled();
    expect(state.listenToEvent).toHaveBeenCalledWith('e');
    expect(state.joinRoom).toHaveBeenCalledWith('r', 'e');
    expect(state.createNewConversation).toHaveBeenCalledWith(
      'temporary',
      'e',
      'r',
    );
    expect(state.renameConversation).toHaveBeenCalledWith('conv-1', 'My Chat');
    expect(state.setSubscriptions).toHaveBeenCalledWith('conv-1', [
      { event: 'e', roomId: 'r' },
    ]);
    expect(newConversationName.value).toBe('');
    expect(newConversationEvent.value).toBe('');
    expect(newConversationRoomId.value).toBe('');
  });

  it('generates a fresh event id when the event field is blank', () => {
    const { newConversationEvent, createConversation } =
      useNewConversationForm();

    newConversationEvent.value = '';
    createConversation('temporary');

    expect(state.listenToEvent).toHaveBeenCalledWith(expect.any(String));
  });

  it('inherits the stream mode from a matching subscription', () => {
    state.subscriptions.value = [
      { event: 'e', roomId: 'r', active: true, stream: false },
    ];

    const { newConversationEvent, newConversationRoomId, createConversation } =
      useNewConversationForm();
    newConversationEvent.value = 'e';
    newConversationRoomId.value = 'r';

    createConversation('temporary');

    expect(state.setStream).toHaveBeenCalledWith('conv-1', false);
  });

  it('lists active events and the rooms of the entered event', () => {
    state.subscriptions.value = [
      { event: 'a', roomId: '', active: true, stream: true },
      { event: 'b', roomId: 'r1', active: true, stream: true },
      { event: 'a', roomId: 'r2', active: true, stream: true },
      { event: 'c', roomId: 'x', active: false, stream: true },
    ];

    const { newConversationEvent, availableSocketEvents, availableRooms } =
      useNewConversationForm();

    expect(availableSocketEvents.value).toEqual(['a', 'b']);

    newConversationEvent.value = 'a';
    expect(availableRooms.value).toEqual(['r2']);
  });
});
