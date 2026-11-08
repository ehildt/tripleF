import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationPersistence } from '@/components/chat/composables/use-conversation-persistence';
import type {
  Conversation,
  UploadedDocument,
} from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { mergeUploadedDocuments } from '@/stores/chat/conversation/helpers/merge-uploaded-documents.helper';

interface ConversationDocuments {
  setUploadedDocuments: (
    conversationStoreId: string,
    documents: UploadedDocument[],
  ) => Promise<void>;
  toggleUploadedDocumentSelected: (
    conversationStoreId: string,
    hash: string,
    targetConversationId?: string,
  ) => Promise<void>;
  removeUploadedDocument: (
    conversationStoreId: string,
    hash: string,
    targetConversationId?: string,
  ) => Promise<void>;
}

/** Own uploaded-document commands and their persistence. */
export function useConversationDocuments(): ConversationDocuments {
  const conversationStore = useConversationStore();
  const catalog = useConversationCatalog();
  const persistence = useConversationPersistence();

  function write(
    conversationStoreId: string,
    mutation: (conversation: Conversation) => boolean,
  ): Promise<void> {
    const apply = (conversation: Conversation) => {
      if (!mutation(conversation)) return Promise.resolve();
      return persistence.persistConversation(conversation);
    };
    const current = conversationStore.getConversation(conversationStoreId);
    if (current?.loaded) return apply(current);
    return catalog
      .loadConversationForWrite(conversationStoreId)
      .then((conversation) => {
        if (conversation) return apply(conversation);
      });
  }

  function setUploadedDocuments(
    conversationStoreId: string,
    documents: UploadedDocument[],
  ): Promise<void> {
    return write(conversationStoreId, (conversation) =>
      conversationStore.patchConversationMedia(conversationStoreId, {
        uploadedDocuments: mergeUploadedDocuments(
          conversation.uploadedDocuments,
          documents,
          conversation.conversationId,
        ),
      }),
    );
  }

  function toggleUploadedDocumentSelected(
    conversationStoreId: string,
    hash: string,
    targetConversationId?: string,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const serverId = targetConversationId ?? conversation.conversationId;
      let found = false;
      const next = conversation.uploadedDocuments.map((document) => {
        if (
          document.hash !== hash ||
          (document.conversationId ?? serverId) !== serverId
        ) {
          return document;
        }
        found = true;
        return { ...document, selected: document.selected === false };
      });
      return found
        ? conversationStore.patchConversationMedia(conversationStoreId, {
            uploadedDocuments: next,
          })
        : false;
    });
  }

  function removeUploadedDocument(
    conversationStoreId: string,
    hash: string,
    targetConversationId?: string,
  ): Promise<void> {
    return write(conversationStoreId, (conversation) => {
      const serverId = targetConversationId ?? conversation.conversationId;
      return conversationStore.patchConversationMedia(conversationStoreId, {
        uploadedDocuments: conversation.uploadedDocuments.filter(
          (document) =>
            !(
              document.hash === hash &&
              (document.conversationId ?? serverId) === serverId
            ),
        ),
      });
    });
  }

  return {
    setUploadedDocuments,
    toggleUploadedDocumentSelected,
    removeUploadedDocument,
  };
}
