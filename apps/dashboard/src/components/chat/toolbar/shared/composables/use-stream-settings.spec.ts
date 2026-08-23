import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { subscriptions } from './subscriptions.state';
import { useStreamSettings } from './use-stream-settings';

vi.mock('../../../../../composables/use-toast', () => ({
  useToast: vi.fn(() => ({
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('useStreamSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    subscriptions.value = [];
  });

  it('defaults isStreamEnabled to true', () => {
    const { isStreamEnabled } = useStreamSettings();
    expect(isStreamEnabled.value).toBe(true);
  });

  it('exposes newSubscriptionEvent and newSubscriptionRoomId refs', () => {
    const { newSubscriptionEvent, newSubscriptionRoomId } = useStreamSettings();
    expect(newSubscriptionEvent.value).toBe('');
    expect(newSubscriptionRoomId.value).toBe('');
  });

  it('reads stream from active conversation when set', () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setStream(conversation.id, false);
    conversationStore.setActiveConversation(conversation.id);

    const { isStreamEnabled } = useStreamSettings();
    expect(isStreamEnabled.value).toBe(false);
  });

  it('toggling the stream syncs the bound socket subscription', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversation.event = 'harness';
    conversation.roomId = 'room1';
    conversationStore.setActiveConversation(conversation.id);

    subscriptions.value = [
      { event: 'harness', roomId: 'room1', active: true, stream: true },
    ];

    const { isStreamEnabled } = useStreamSettings();
    isStreamEnabled.value = false;
    await nextTick();

    expect(subscriptions.value[0].stream).toBe(false);
  });
});
