import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Ref } from 'vue';

import type { SubscriptionEntry } from '@/types/subscription.model';

import { useNewConversationForm } from './use-new-conversation-form';

const state = vi.hoisted(() => ({
  createNewConversation: vi.fn(),
  subscriptions: undefined as unknown as Ref<SubscriptionEntry[]>,
  ensureSocketConnection: vi.fn(),
  listenToEvent: vi.fn(),
  joinRoom: vi.fn(),
}));

vi.mock('@/components/chat/composables/use-conversation-catalog', () => ({
  useConversationCatalog: () => ({
    createNewConversation: state.createNewConversation,
  }),
}));
vi.mock('@/composables/use-socket/use-socket', () => ({
  useSocket: () => ({
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
    state.subscriptions.value = [];
    state.createNewConversation.mockClear();
    state.ensureSocketConnection.mockClear();
    state.listenToEvent.mockClear();
    state.joinRoom.mockClear();
  });

  it('wires the socket and creates one fully initialized conversation', () => {
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
      {
        title: 'My Chat',
        subscriptions: [{ event: 'e', roomId: 'r' }],
        stream: true,
      },
    );
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

    expect(state.createNewConversation).toHaveBeenCalledWith(
      'temporary',
      'e',
      'r',
      expect.objectContaining({ stream: false }),
    );
  });

  it('lists active events and rooms for the entered event', () => {
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
