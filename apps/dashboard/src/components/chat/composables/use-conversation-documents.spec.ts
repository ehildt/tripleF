import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { createConversation } from '@/stores/chat/conversation/helpers/create-conversation.helper';
import { getUploadedDocumentsForConversation } from '@/stores/chat/conversation/helpers/get-uploaded-documents-for-conversation.helper';

import { useConversationDocuments } from './use-conversation-documents';

const catalog = vi.hoisted(() => ({ loadConversationForWrite: vi.fn() }));
const persistence = vi.hoisted(() => ({
  persistConversation: vi.fn(async () => {}),
}));

vi.mock('./use-conversation-catalog', () => ({
  useConversationCatalog: () => catalog,
}));
vi.mock('./use-conversation-persistence', () => ({
  useConversationPersistence: () => persistence,
}));

function seed() {
  const conversation = createConversation('New chat', {
    conversationId: 'server-1',
  });
  useConversationStore().insertConversation(conversation, true);
  return conversation;
}

function document(hash: string, conversationId: string) {
  return {
    name: `${hash}.txt`,
    hash,
    type: 'text/plain',
    uploadedAt: 1,
    selected: true,
    conversationId,
  };
}

describe('useConversationDocuments', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    persistence.persistConversation.mockResolvedValue(undefined);
    catalog.loadConversationForWrite.mockImplementation(async (id: string) =>
      useConversationStore().getConversation(id),
    );
  });

  it('merges, scopes, toggles, and removes uploaded documents', async () => {
    const conversation = seed();
    const documents = useConversationDocuments();
    await documents.setUploadedDocuments(conversation.id, [
      document('current', conversation.conversationId),
      document('other', 'other-context'),
    ]);

    expect(
      getUploadedDocumentsForConversation(
        conversation,
        conversation.conversationId,
      ),
    ).toHaveLength(1);
    expect(
      getUploadedDocumentsForConversation(conversation, 'other-context'),
    ).toHaveLength(1);

    await documents.toggleUploadedDocumentSelected(
      conversation.id,
      'current',
      conversation.conversationId,
    );
    expect(conversation.uploadedDocuments[0].selected).toBe(false);
    await documents.removeUploadedDocument(
      conversation.id,
      'current',
      conversation.conversationId,
    );
    expect(
      getUploadedDocumentsForConversation(
        conversation,
        conversation.conversationId,
      ),
    ).toHaveLength(0);
    expect(persistence.persistConversation).toHaveBeenCalledTimes(3);
  });

  it('does nothing for unknown records', async () => {
    await useConversationDocuments().setUploadedDocuments('missing', []);

    expect(catalog.loadConversationForWrite).toHaveBeenCalledWith('missing');
    expect(persistence.persistConversation).not.toHaveBeenCalled();
  });
});
