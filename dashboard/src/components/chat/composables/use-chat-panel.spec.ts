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

  it('follows an added playlist video into the playlist tab', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    const playlistVideoCount = ref(0);

    const { rightPanelView } = useChatPanel(
      ref(false),
      ref(false),
      ref(true),
      playlistVideoCount,
    );
    await flushPromises();
    rightPanelView.value = 'history';

    playlistVideoCount.value = 1;
    await flushPromises();

    expect(rightPanelView.value).toBe('playlist');
  });

  it('follows an added attachment into the files tab', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    const attachmentCount = ref(0);

    const { rightPanelView } = useChatPanel(
      ref(true),
      ref(false),
      ref(false),
      ref(0),
      attachmentCount,
    );
    await flushPromises();
    rightPanelView.value = 'history';

    attachmentCount.value = 1;
    await flushPromises();

    expect(rightPanelView.value).toBe('files');
  });

  it('follows a new prompt into the history tab', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    const historyItemCount = ref(1);

    const { rightPanelView } = useChatPanel(
      ref(false),
      ref(true),
      ref(true),
      ref(1),
      ref(0),
      historyItemCount,
    );
    await flushPromises();
    rightPanelView.value = 'playlist';

    historyItemCount.value = 2;
    await flushPromises();

    expect(rightPanelView.value).toBe('history');
  });

  it('also follows removals, since any tab change is surfaced', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    const playlistVideoCount = ref(2);

    const { rightPanelView } = useChatPanel(
      ref(false),
      ref(true),
      ref(true),
      playlistVideoCount,
    );
    await flushPromises();
    rightPanelView.value = 'history';

    playlistVideoCount.value = 1;
    await flushPromises();

    expect(rightPanelView.value).toBe('playlist');
  });

  it('falls back to the next available tab when a removal empties the current one', async () => {
    const conversationStore = useConversationStore();
    const conversation = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(conversation.id);
    const hasPlaylist = ref(true);
    const playlistVideoCount = ref(1);

    const { rightPanelView } = useChatPanel(
      ref(false),
      ref(true),
      hasPlaylist,
      playlistVideoCount,
    );
    await flushPromises();
    rightPanelView.value = 'playlist';

    // Removing the last playlist item: the count change must not pull the
    // view back into a tab that has no content left.
    playlistVideoCount.value = 0;
    hasPlaylist.value = false;
    await flushPromises();

    expect(rightPanelView.value).toBe('history');
  });

  it('does not follow counts loaded by a conversation switch', async () => {
    const conversationStore = useConversationStore();
    const first = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(first.id);
    const playlistVideoCount = ref(1);

    const { rightPanelView } = useChatPanel(
      ref(false),
      ref(true),
      ref(false),
      playlistVideoCount,
    );
    await flushPromises();

    const second = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(second.id);
    playlistVideoCount.value = 3;
    await flushPromises();

    expect(rightPanelView.value).toBe('history');
  });

  it('keeps the player on the playlist tab across a switch with a list', async () => {
    const conversationStore = useConversationStore();
    const first = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(first.id);
    const hasPlaylist = ref(true);

    const { rightPanelView } = useChatPanel(ref(false), ref(true), hasPlaylist);
    await flushPromises();
    rightPanelView.value = 'playlist';

    const second = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(second.id);
    await flushPromises();

    expect(rightPanelView.value).toBe('playlist');
  });

  it('leaves the playlist tab on a switch when the new conversation has no list', async () => {
    const conversationStore = useConversationStore();
    const first = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(first.id);
    const hasPlaylist = ref(true);

    const { rightPanelView } = useChatPanel(ref(false), ref(true), hasPlaylist);
    await flushPromises();
    rightPanelView.value = 'playlist';

    const second = conversationStore.ensureConversation();
    conversationStore.setActiveConversation(second.id);
    hasPlaylist.value = false;
    await flushPromises();

    expect(rightPanelView.value).toBe('history');
  });
});
