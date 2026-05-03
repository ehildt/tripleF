import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { useChatPanel } from './use-chat-panel';

describe('useChatPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults rightPanelView to files', () => {
    const { rightPanelView } = useChatPanel(ref(false), ref(false));
    expect(rightPanelView.value).toBe('files');
  });

  it('switches to history when the active conversation changes and history exists', async () => {
    const conversationStore = useConversationStore();

    const { rightPanelView } = useChatPanel(ref(false), ref(true));
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    await flushPromises();

    expect(rightPanelView.value).toBe('history');
  });

  it('switches from files to history when attachments are removed but history remains', async () => {
    const hasAttachments = ref(true);
    const hasHistory = ref(true);
    const { rightPanelView } = useChatPanel(hasAttachments, hasHistory);

    expect(rightPanelView.value).toBe('files');

    hasAttachments.value = false;
    await flushPromises();

    expect(rightPanelView.value).toBe('history');
  });

  it('switches from history to files when history is removed but attachments remain', async () => {
    const hasAttachments = ref(false);
    const hasHistory = ref(true);
    const { rightPanelView } = useChatPanel(hasAttachments, hasHistory);

    rightPanelView.value = 'history';

    hasAttachments.value = true;
    hasHistory.value = false;
    await flushPromises();

    expect(rightPanelView.value).toBe('files');
  });

  it('shows history immediately when an active conversation already has prompts (reload scenario)', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversation.exchanges = [
      {
        id: '1',
        role: 'user',
        content: 'hello',
        status: 'done',
        timestamp: 0,
      },
    ];
    conversationStore.setActiveConversation(conversation.id);

    const { rightPanelView } = useChatPanel(ref(false), ref(true));
    await flushPromises();

    expect(rightPanelView.value).toBe('history');
  });

  it('prefers files over history when attachments exist', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversation.uploadedImages = [
      { name: 'a.png', hash: 'h', uploadedAt: 0, conversationId: 'c1' },
    ];
    conversation.exchanges = [
      {
        id: '1',
        role: 'user',
        content: 'hello',
        status: 'done',
        timestamp: 0,
      },
    ];
    conversationStore.setActiveConversation(conversation.id);

    const { rightPanelView } = useChatPanel(ref(true), ref(true));
    await flushPromises();

    expect(rightPanelView.value).toBe('files');
  });
});
