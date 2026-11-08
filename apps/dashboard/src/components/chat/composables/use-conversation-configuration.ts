import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationPersistence } from '@/components/chat/composables/use-conversation-persistence';
import type {
  Conversation,
  ConversationSubscription,
} from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';

interface ConversationConfiguration {
  patchConversation: (
    conversationStoreId: string,
    patch: Partial<
      Pick<
        Conversation,
        'model' | 'numCtx' | 'think' | 'stream' | 'event' | 'roomId'
      >
    >,
  ) => Promise<void>;
  setModel: (conversationStoreId: string, model: string) => Promise<void>;
  setNumCtx: (conversationStoreId: string, numCtx: string) => Promise<void>;
  setThink: (conversationStoreId: string, think: string) => Promise<void>;
  setStream: (conversationStoreId: string, stream: boolean) => Promise<void>;
  setEvent: (conversationStoreId: string, event: string) => Promise<void>;
  setRoomId: (conversationStoreId: string, roomId: string) => Promise<void>;
  setConversationId: (
    conversationStoreId: string,
    serverConversationId: string,
  ) => Promise<void>;
  setSavedFileInfos: (
    conversationStoreId: string,
    files: File[],
  ) => Promise<void>;
  setSubscriptions: (
    conversationStoreId: string,
    subscriptions: ConversationSubscription[],
  ) => Promise<void>;
}

/** Persist configuration changes after hydrating their target record. */
export function useConversationConfiguration(): ConversationConfiguration {
  const conversationStore = useConversationStore();
  const catalog = useConversationCatalog();
  const persistence = useConversationPersistence();

  function write(
    conversationStoreId: string,
    mutation: (conversation: Conversation) => void,
  ): Promise<void> {
    const apply = (conversation: Conversation) => {
      mutation(conversation);
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

  function patchConversation(
    conversationStoreId: string,
    patch: Partial<
      Pick<
        Conversation,
        'model' | 'numCtx' | 'think' | 'stream' | 'event' | 'roomId'
      >
    >,
  ): Promise<void> {
    return write(conversationStoreId, () => {
      conversationStore.patchConversation(conversationStoreId, patch);
    });
  }

  function setModel(conversationStoreId: string, model: string): Promise<void> {
    return patchConversation(conversationStoreId, { model });
  }

  function setNumCtx(
    conversationStoreId: string,
    numCtx: string,
  ): Promise<void> {
    return patchConversation(conversationStoreId, { numCtx });
  }

  function setThink(conversationStoreId: string, think: string): Promise<void> {
    return patchConversation(conversationStoreId, { think });
  }

  function setStream(
    conversationStoreId: string,
    stream: boolean,
  ): Promise<void> {
    return patchConversation(conversationStoreId, { stream });
  }

  function setEvent(conversationStoreId: string, event: string): Promise<void> {
    return patchConversation(conversationStoreId, { event });
  }

  function setRoomId(
    conversationStoreId: string,
    roomId: string,
  ): Promise<void> {
    return patchConversation(conversationStoreId, { roomId });
  }

  function setConversationId(
    conversationStoreId: string,
    serverConversationId: string,
  ): Promise<void> {
    return write(conversationStoreId, () => {
      conversationStore.setConversationId(
        conversationStoreId,
        serverConversationId,
      );
    });
  }

  function setSavedFileInfos(
    conversationStoreId: string,
    files: File[],
  ): Promise<void> {
    return write(conversationStoreId, () => {
      conversationStore.setSavedFileInfos(conversationStoreId, files);
    });
  }

  function setSubscriptions(
    conversationStoreId: string,
    subscriptions: ConversationSubscription[],
  ): Promise<void> {
    return write(conversationStoreId, () => {
      conversationStore.setSubscriptions(conversationStoreId, subscriptions);
    });
  }

  return {
    patchConversation,
    setModel,
    setNumCtx,
    setThink,
    setStream,
    setEvent,
    setRoomId,
    setConversationId,
    setSavedFileInfos,
    setSubscriptions,
  };
}
