import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { deleteUploadedObject } from '@/api/object-storage.api';
import type { Conversation } from '@/stores/chat/conversation/conversation.model';
import type { SubscriptionEntry } from '@/types/subscription.model';

import { useDeleteConversation } from './use-delete-conversation';

vi.mock('@/api/object-storage.api', () => ({
  deleteUploadedObject: vi.fn(async () => {}),
}));

const state = vi.hoisted(() => ({
  conversations: [] as Conversation[],
  target: undefined as Conversation | undefined,
  setSubscriptions: vi.fn(),
  loadConversationForWrite: vi.fn(),
  deleteConversationContext: vi.fn(),
  persistConversation: vi.fn(async () => {}),
  removeConversationLocally: vi.fn(async () => {}),
  deletePersistentConversation: vi.fn(async () => {}),
  clearPendingFiles: vi.fn(),
  removeSubscriptionByEventRoom: vi.fn(),
  closeRoom: vi.fn(),
  closeEvent: vi.fn(),
}));

vi.mock('@/stores/chat/conversation/conversation.store', () => ({
  useConversationStore: () => ({
    conversations: state.conversations,
    getConversation: () => state.target,
    deleteConversationContext: state.deleteConversationContext,
  }),
}));
vi.mock('@/components/chat/composables/use-conversation-catalog', () => ({
  useConversationCatalog: () => ({
    loadConversationForWrite: state.loadConversationForWrite,
  }),
}));
vi.mock('@/components/chat/composables/use-conversation-configuration', () => ({
  useConversationConfiguration: () => ({
    setSubscriptions: state.setSubscriptions,
  }),
}));
vi.mock('@/components/chat/composables/use-conversation-persistence', () => ({
  useConversationPersistence: () => ({
    persistConversation: state.persistConversation,
    removeConversationLocally: state.removeConversationLocally,
    deletePersistentConversation: state.deletePersistentConversation,
  }),
}));
vi.mock('@/components/chat/shared/composables/use-pending-attachments', () => ({
  usePendingAttachments: () => ({ clearPendingFiles: state.clearPendingFiles }),
}));
vi.mock('@/composables/use-socket/use-socket', () => ({
  useSocket: () => ({
    closeRoom: state.closeRoom,
    closeEvent: state.closeEvent,
  }),
}));
vi.mock('./use-socket-subscriptions', () => ({
  useSocketSubscriptions: () => ({
    subscriptions: ref<SubscriptionEntry[]>([]),
    removeSubscriptionByEventRoom: state.removeSubscriptionByEventRoom,
  }),
}));

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    title: 'Chat',
    conversationId: 'context-1',
    event: 'e',
    roomId: 'r',
    stream: true,
    subscriptions: [],
    exchanges: [],
    uploadedImages: [],
    uploadedDocuments: [],
    type: 'temporary',
    ...overrides,
  } as Conversation;
}

describe('useDeleteConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.conversations = [];
    state.target = undefined;
    state.loadConversationForWrite.mockImplementation(async () => state.target);
    state.deleteConversationContext.mockReturnValue({
      removedImages: [],
      recordRemoved: true,
      conversationType: 'temporary',
    });
  });

  it('closes sockets, deletes the record, and clears pending attachments', async () => {
    const target = conversation();
    state.target = target;
    state.conversations = [target];

    await useDeleteConversation().deleteConversation(target.id);

    expect(state.closeRoom).toHaveBeenCalledWith('e', 'r');
    expect(state.closeEvent).toHaveBeenCalledWith('e');
    expect(state.setSubscriptions).toHaveBeenCalledWith('c1', []);
    expect(state.deleteConversationContext).toHaveBeenCalledWith(
      'c1',
      'context-1',
    );
    expect(state.removeConversationLocally).toHaveBeenCalledWith('context-1');
    expect(state.clearPendingFiles).toHaveBeenCalledWith({
      parentConversationId: 'c1',
      conversationId: 'context-1',
    });
  });

  it('keeps a socket shared with another conversation', async () => {
    const target = conversation();
    const sharer = conversation({ id: 'c2' });
    state.target = target;
    state.conversations = [target, sharer];

    await useDeleteConversation().deleteConversation(target.id);

    expect(state.closeRoom).not.toHaveBeenCalled();
    expect(state.closeEvent).not.toHaveBeenCalled();
    expect(state.deleteConversationContext).toHaveBeenCalledWith(
      'c1',
      'context-1',
    );
  });

  it('deletes only unreferenced images and the persistent record', async () => {
    const target = conversation({
      type: 'persistent',
      uploadedImages: [
        {
          name: 'shared',
          hash: 'shared',
          uploadedAt: 1,
          conversationId: 'other-context',
        },
        {
          name: 'unique',
          hash: 'unique',
          uploadedAt: 1,
          conversationId: 'context-1',
        },
      ],
    });
    state.target = target;
    state.conversations = [target];
    state.deleteConversationContext.mockReturnValue({
      removedImages: [{ hash: 'shared' }, { hash: 'unique' }],
      recordRemoved: true,
      conversationType: 'persistent',
    });

    await useDeleteConversation().deleteConversation(target.id);

    expect(deleteUploadedObject).toHaveBeenCalledTimes(1);
    expect(deleteUploadedObject).toHaveBeenCalledWith(
      'c1',
      'context-1',
      'unique',
    );
    expect(state.deletePersistentConversation).toHaveBeenCalledWith(
      'context-1',
    );
  });

  it('persists a record that retains another context', async () => {
    const target = conversation();
    state.target = target;
    state.conversations = [target];
    state.deleteConversationContext.mockReturnValue({
      removedImages: [],
      recordRemoved: false,
      conversationType: 'temporary',
    });

    await useDeleteConversation().deleteConversation(target.id);

    expect(state.persistConversation).toHaveBeenCalledWith(target);
    expect(state.removeConversationLocally).not.toHaveBeenCalled();
  });

  it('does nothing for an unknown conversation', async () => {
    await useDeleteConversation().deleteConversation('missing');

    expect(state.loadConversationForWrite).not.toHaveBeenCalled();
    expect(state.deleteConversationContext).not.toHaveBeenCalled();
  });
});
