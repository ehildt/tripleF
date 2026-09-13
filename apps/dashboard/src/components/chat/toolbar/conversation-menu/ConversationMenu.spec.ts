import { DOMWrapper, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import { inMemoryTemporaryConversationsTable } from '@/test-utils/in-memory-temporary-conversations';

import { subscriptions } from '../shared/composables/subscriptions.state';
import ConversationMenu from './ConversationMenu.vue';

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

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(ConversationMenu, {
    props: {
      isOpen: true,
      ...props,
    },
  });
}

/** The name input is teleported to <body> — find it outside the wrapper. */
function nameInput() {
  const element = document.body.querySelector<HTMLInputElement>(
    'input[name="conversation-name"]',
  );
  return element ? new DOMWrapper(element) : null;
}

describe('ConversationMenu', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    inMemoryTemporaryConversationsTable.clear();
    subscriptions.value = [];
    vi.clearAllMocks();
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a temporary conversation when Enter is pressed with a name', async () => {
    const wrapper = mountMenu();
    const input = nameInput();
    expect(input).not.toBeNull();

    await input!.setValue('Code Review');
    await input!.trigger('keydown.enter');
    await nextTick();

    expect(wrapper.emitted('created')).toBeTruthy();
    expect(useConversationStore().conversations).toHaveLength(1);

    wrapper.unmount();
  });

  it('does not create a conversation when Enter is pressed with a blank name', async () => {
    const wrapper = mountMenu();
    const input = nameInput();
    expect(input).not.toBeNull();

    await input!.trigger('keydown.enter');
    await nextTick();

    expect(wrapper.emitted('created')).toBeUndefined();
    expect(useConversationStore().conversations).toHaveLength(0);

    wrapper.unmount();
  });
});
