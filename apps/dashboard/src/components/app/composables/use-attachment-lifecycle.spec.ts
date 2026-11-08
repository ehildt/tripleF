import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { usePendingAttachments } from '@/components/chat/shared/composables/use-pending-attachments';
import { useAttachedFilesStore } from '@/stores/chat/attached-files/attached-files.store';

import { useAttachmentLifecycle } from './use-attachment-lifecycle';

vi.mock('@/api/conversations.api', () => ({
  fetchConversations: vi.fn(),
  fetchConversation: vi.fn(),
  saveConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

const LifecycleHost = defineComponent({
  setup() {
    useAttachmentLifecycle();
    return () => null;
  },
});

describe('useAttachmentLifecycle', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.mocked(
      (await import('@/api/conversations.api')).fetchConversations,
    ).mockResolvedValue([]);
    let nextUrl = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(
      () => `blob:mock-${++nextUrl}`,
    );
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    setActivePinia(createPinia());
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('revokes every remaining object URL only when the app owner unmounts', () => {
    const conversation = useConversationCatalog().ensureConversation();
    useConversationCatalog().setActiveConversation(conversation.id);
    const pending = usePendingAttachments();
    pending.addPendingFile(
      {
        parentConversationId: conversation.id,
        conversationId: conversation.conversationId,
      },
      new File(['image'], 'one.png', { type: 'image/png' }),
      'image-hash',
      'image',
    );
    pending.addPendingFile(
      { parentConversationId: 'other', conversationId: 'other' },
      new File(['image'], 'two.png', { type: 'image/png' }),
      'other-hash',
      'image',
    );
    const wrapper = mount(LifecycleHost);

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    wrapper.unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-1');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-2');
    expect(useAttachedFilesStore().pendingFilesByConversation.size).toBe(0);
  });
});
