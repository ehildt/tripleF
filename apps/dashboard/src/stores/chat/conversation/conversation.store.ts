import { defineStore } from 'pinia';
import { ref } from 'vue';

import { calcTotalContextPercentage } from '@/components/chat/shared/helpers/calc-total-context-percentage.helper';
import { createId } from '@/utils/create-id/create-id.helper';

import { inferConversationTitle } from './helpers/infer-conversation-title.helper';
import { mapFileToSavedInfo } from './helpers/map-file-to-saved-info.helper';
import { partitionConversationContext } from './helpers/partition-conversation-context.helper';
import type {
  Conversation,
  ConversationSubscription,
  ConversationType,
  Exchange,
} from './conversation.model';
import type { ConversationContextDeletion } from './conversation.store.types';

/** Canonical conversation records and synchronous mutations; I/O lives outside. */
export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([]);
  const hydrated = ref(false);

  function getConversation(id: string): Conversation | undefined {
    return conversations.value.find((conversation) => conversation.id === id);
  }

  function getLoadedConversation(id: string): Conversation | undefined {
    const conversation = getConversation(id);
    return conversation?.loaded ? conversation : undefined;
  }

  function getConversationId(conversationStoreId: string): string {
    return getConversation(conversationStoreId)?.conversationId ?? '';
  }

  function mergeConversationStubs(stubs: Conversation[]): void {
    const inMemoryIds = new Set(
      conversations.value.map((conversation) => conversation.id),
    );
    conversations.value = [
      ...conversations.value,
      ...stubs.filter((stub) => !inMemoryIds.has(stub.id)),
    ];
    hydrated.value = true;
  }

  function applyLoadedConversation(
    serverConversationId: string,
    loaded: Conversation,
  ): Conversation {
    const stub = conversations.value.find(
      (conversation) => conversation.conversationId === serverConversationId,
    );
    if (!stub) {
      conversations.value.unshift(loaded);
      return loaded;
    }
    Object.assign(stub, loaded, { loaded: true });
    stub.contextUsagePercent = calcTotalContextPercentage(
      stub.exchanges,
      stub.numCtx,
    );
    return stub;
  }

  function insertConversation(conversation: Conversation): void {
    conversations.value.unshift(conversation);
  }

  function renameConversation(id: string, title: string): boolean {
    const conversation = getLoadedConversation(id);
    if (!conversation) return false;
    conversation.title = title;
    return true;
  }

  function setConversationType(id: string, type: ConversationType): void {
    const conversation = getConversation(id);
    if (conversation) conversation.type = type;
  }

  function patchConversation(
    id: string,
    patch: Partial<
      Pick<
        Conversation,
        'model' | 'numCtx' | 'think' | 'stream' | 'event' | 'roomId'
      >
    >,
  ): void {
    const conversation = getConversation(id);
    if (conversation) Object.assign(conversation, patch);
  }

  function patchConversationMedia(
    id: string,
    patch: Partial<
      Pick<
        Conversation,
        'uploadedImages' | 'uploadedDocuments' | 'imageSelectionSnapshot'
      >
    >,
  ): boolean {
    const conversation = getLoadedConversation(id);
    if (!conversation) return false;
    Object.assign(conversation, patch);
    return true;
  }

  function clearImageSelectionSnapshot(id: string): void {
    const conversation = getConversation(id);
    if (conversation) conversation.imageSelectionSnapshot = {};
  }

  function setConversationId(
    id: string,
    serverConversationId: string,
  ): boolean {
    const conversation = getLoadedConversation(id);
    if (!conversation) return false;
    conversation.conversationId = serverConversationId;
    return true;
  }

  function setSavedFileInfos(id: string, files: File[]): boolean {
    const conversation = getLoadedConversation(id);
    if (!conversation) return false;
    conversation.savedFileInfos = files.map(mapFileToSavedInfo);
    return true;
  }

  function setSubscriptions(
    id: string,
    subscriptions: ConversationSubscription[],
  ): boolean {
    const conversation = getLoadedConversation(id);
    if (!conversation) return false;
    conversation.subscriptions = subscriptions;
    return true;
  }

  function appendExchange(
    conversation: Conversation,
    exchange: Omit<Exchange, 'timestamp' | 'id'>,
    defaultTitle: string,
  ): Exchange {
    const appended: Exchange = {
      ...exchange,
      id: createId(),
      timestamp: Date.now(),
    };
    conversation.exchanges.push(appended);
    conversation.updatedAt = Date.now();
    conversation.title = inferConversationTitle(
      conversation.title,
      exchange.content,
      defaultTitle,
    );
    return appended;
  }

  function addExchange(
    id: string,
    exchange: Omit<Exchange, 'timestamp' | 'id'>,
    defaultTitle?: string,
  ): Exchange | undefined {
    const conversation = getLoadedConversation(id);
    return conversation
      ? appendExchange(
          conversation,
          exchange,
          defaultTitle ?? conversation.title,
        )
      : undefined;
  }

  function patchAssistantExchange(
    id: string,
    requestId: string,
    patch: Partial<Exchange>,
    touchUpdatedAt = false,
  ): boolean {
    const conversation = getConversation(id);
    const exchange = conversation?.exchanges.find(
      (candidate) =>
        candidate.requestId === requestId && candidate.role === 'assistant',
    );
    if (!conversation || !exchange) return false;
    Object.assign(exchange, patch);
    if (touchUpdatedAt) conversation.updatedAt = Date.now();
    return true;
  }

  function touchConversation(id: string): void {
    const conversation = getConversation(id);
    if (conversation) conversation.updatedAt = Date.now();
  }

  function replaceExchanges(id: string, exchanges: Exchange[]): boolean {
    const conversation = getLoadedConversation(id);
    if (!conversation) return false;
    conversation.exchanges = exchanges;
    return true;
  }

  function consumeMergedSources(
    id: string,
    requestId: string,
    originRequestIds: string[],
  ): void {
    const conversation = getLoadedConversation(id);
    if (!conversation) return;
    const origins = new Set(originRequestIds);
    for (const source of conversation.exchanges) {
      if (source.requestId && origins.has(source.requestId)) {
        source.included = false;
        source.mergedInto = requestId;
      }
    }
  }

  function deleteConversationContext(
    parentId: string,
    serverConversationId: string,
  ): ConversationContextDeletion | undefined {
    const conversation = getLoadedConversation(parentId);
    if (!conversation) return undefined;
    const conversationType = conversation.type;
    const partition = partitionConversationContext(
      conversation,
      serverConversationId,
    );
    conversation.exchanges = partition.exchanges;
    conversation.uploadedImages = partition.uploadedImages;

    const recordRemoved = conversation.exchanges.length === 0;

    if (recordRemoved) {
      const index = conversations.value.findIndex(({ id }) => id === parentId);
      if (index !== -1) conversations.value.splice(index, 1);
    }

    return {
      removedImages: partition.removedImages,
      recordRemoved,
      conversationType,
    };
  }

  return {
    conversations,
    hydrated,
    getConversation,
    getConversationId,
    mergeConversationStubs,
    applyLoadedConversation,
    insertConversation,
    renameConversation,
    setConversationType,
    patchConversation,
    patchConversationMedia,
    clearImageSelectionSnapshot,
    setConversationId,
    setSavedFileInfos,
    setSubscriptions,
    addExchange,
    patchAssistantExchange,
    touchConversation,
    replaceExchanges,
    consumeMergedSources,
    deleteConversationContext,
  };
});
