import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';

import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { usePendingAttachments } from '@/components/chat/shared/composables/use-pending-attachments';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';

import { useAttachmentConversationSync } from './use-attachment-conversation-sync';

vi.mock('@/api/conversations.api', () => ({
  fetchConversations: vi.fn(),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

const SyncHost = defineComponent({
  setup() {
    useAttachmentConversationSync();
    return () => null;
  },
});

describe('useAttachmentConversationSync', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.mocked(
      (await import('@/api/conversations.api')).fetchConversations,
    ).mockResolvedValue([]);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    setActivePinia(createPinia());
    useConversationStore();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('preserves saved file metadata as pending selection changes', async () => {
    const conversation = useConversationCatalog().ensureConversation();
    useConversationCatalog().setActiveConversation(conversation.id);
    const scope = {
      parentConversationId: conversation.id,
      conversationId: conversation.conversationId,
    };
    const wrapper = mount(SyncHost);
    const pending = usePendingAttachments();
    const file = new File(['body'], 'notes.txt', { type: 'text/plain' });

    pending.addPendingFile(scope, file, 'notes-hash', 'document');
    await nextTick();
    expect(conversation.savedFileInfos).toHaveLength(1);
    expect(conversation.savedFileInfos[0].name).toBe('notes.txt');

    pending.togglePendingFile(pending.attachedFiles.value[0].id);
    await nextTick();
    expect(conversation.savedFileInfos).toEqual([]);
    wrapper.unmount();
  });

  it('synchronizes metadata for a newly active conversation pair', async () => {
    const conversationStore = useConversationStore();
    const first = useConversationCatalog().ensureConversation();
    const second = useConversationCatalog().createNewConversation();
    useConversationCatalog().setActiveConversation(first.id);
    const setSavedFileInfos = vi.spyOn(conversationStore, 'setSavedFileInfos');
    const wrapper = mount(SyncHost);

    useConversationCatalog().setActiveConversation(second.id);
    await nextTick();

    expect(setSavedFileInfos).toHaveBeenCalledWith(second.id, []);
    expect(second.savedFileInfos).toEqual([]);
    wrapper.unmount();
  });
});
