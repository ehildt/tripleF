import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useConversationStore } from '@/stores/conversation';
import { useSocketStore } from '@/stores/socket';

import { useChatConversation } from '../composables/use-chat-conversation';
import ChatRightPanel from './ChatRightPanel.vue';

describe('history branch-out integration', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('creates a new conversation with the clicked user/assistant pair', async () => {
    const conversationStore = useConversationStore();
    const socketStore = useSocketStore();
    vi.spyOn(socketStore, 'ensureSocketConnection').mockImplementation(
      () => {},
    );
    vi.spyOn(socketStore, 'listenToEvent').mockImplementation(() => {});
    vi.spyOn(socketStore, 'joinRoom').mockImplementation(() => {});

    const conversation = conversationStore.ensureConversation();
    conversation.exchanges = [
      {
        id: 'u1',
        role: 'user',
        content: 'first question',
        status: 'done',
        timestamp: 0,
        requestId: 'r1',
        conversationId: conversation.conversationId,
      },
      {
        id: 'a1',
        role: 'assistant',
        content: 'first answer',
        status: 'done',
        timestamp: 0,
        requestId: 'r1',
        conversationId: conversation.conversationId,
      },
      {
        id: 'u2',
        role: 'user',
        content: 'second question',
        status: 'done',
        timestamp: 0,
        requestId: 'r2',
        conversationId: conversation.conversationId,
      },
      {
        id: 'a2',
        role: 'assistant',
        content: 'second answer',
        status: 'done',
        timestamp: 0,
        requestId: 'r2',
        conversationId: conversation.conversationId,
      },
    ];
    conversationStore.setActiveConversation(conversation.id);

    const Harness = defineComponent({
      setup() {
        const {
          messageListItems,
          branchUserExchange,
          conversation: conv,
        } = useChatConversation();
        return () =>
          h(ChatRightPanel, {
            attachments: [],
            messageListItems: messageListItems.value,
            playlistVideos: [],
            rightPanelView: 'history',
            conversation: conv.value,
            onBranchOut: branchUserExchange,
          });
      },
    });

    const wrapper = mount(Harness);
    const branchButtons = wrapper.findAll(
      '.expandable-message-list__toggle-branch',
    );
    expect(branchButtons).toHaveLength(2);

    await branchButtons[1].trigger('click');

    const branched = conversationStore.getConversation(
      conversationStore.activeConversationId!,
    );
    expect(branched).toBeDefined();
    expect(branched!.id).not.toBe(conversation.id);
    expect(branched!.exchanges.map((e) => [e.role, e.content])).toEqual([
      ['user', 'second question'],
      ['assistant', 'second answer'],
    ]);

    // The copies are re-tagged to the new conversation, so deleting the
    // branched conversation empties and removes it (previously the parent
    // backlink made it undeletable).
    expect(
      branched!.exchanges.every(
        (e) => e.conversationId === branched!.conversationId,
      ),
    ).toBe(true);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => ({}) }),
    );
    await conversationStore.deleteCurrentConversation(branched!.id);
    expect(conversationStore.getConversation(branched!.id)).toBeUndefined();
    expect(conversationStore.activeConversationId).toBe(conversation.id);
  });
});
