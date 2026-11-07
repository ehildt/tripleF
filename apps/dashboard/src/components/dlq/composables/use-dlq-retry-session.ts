import { useSocket } from '@/composables/use-socket/use-socket';
import { i18n } from '@/i18n/i18n';
import type { Conversation } from '@/stores/conversation/conversation.model';
import { useConversationStore } from '@/stores/conversation/conversation.store';
import { useDebugStore } from '@/stores/debug/debug.store';
import { useMessagesStore } from '@/stores/messages/messages.store';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useToast } from '../../../composables/use-toast/use-toast';
import { buildRecoveredConversation } from '../helpers/build-recovered-conversation.helper';
import { extractEntryFilters } from '../helpers/extract-entry-filters.helper';
import type { DlqEntryFilters } from '../helpers/extract-entry-filters.helper.types';
import { extractPromptMessages } from '../helpers/extract-prompt-messages.helper';
import type { DlqRetrySession } from './use-dlq-retry-session.types';

/** Prepare an existing or recovered conversation for a harness DLQ replay.
 * Retry always targets the payload's stable conversation id and job name;
 * the active chat is never a fallback. */
export function useDlqRetrySession() {
  const socketStore = useSocket();
  const conversationStore = useConversationStore();
  const debugStore = useDebugStore();
  const messagesStore = useMessagesStore();
  const toast = useToast();

  function ensureSocketSubscription(roomId: string, eventName: string): void {
    socketStore.ensureSocketConnection();

    if (!socketStore.connectedEvents.value.has(eventName)) {
      socketStore.listenToEvent(eventName);
      toast.debug(`Resubscribed to ${eventName}`);
    }

    if (
      roomId &&
      !(socketStore.connectedRooms.value.get(eventName)?.has(roomId) ?? false)
    ) {
      socketStore.joinRoom(roomId, eventName);
      toast.debug(`Rejoined room: ${roomId}`);
    }
  }

  async function resolveConversation(
    entry: DlqEntry,
    filters: DlqEntryFilters,
  ): Promise<Conversation> {
    const existing = conversationStore.conversations.find(
      (conversation) => conversation.conversationId === filters.conversationId,
    );

    if (!existing)
      return conversationStore.restoreConversation(
        buildRecoveredConversation(entry),
      );

    const loaded = await conversationStore.loadConversationForWrite(
      existing.id,
    );

    if (!loaded)
      throw new Error(
        `Conversation ${filters.conversationId} could not be loaded for retry`,
      );

    return loaded;
  }

  function seedFailedPromptIfMissing(
    conversation: Conversation,
    entry: DlqEntry,
    filters: DlqEntryFilters,
  ): void {
    const hasFailedTurn = conversation.exchanges.some(
      (exchange) => exchange.requestId === entry.jobName,
    );

    if (hasFailedTurn) return;

    const failedPrompt = extractPromptMessages(entry)
      .filter((message) => message.role === 'user')
      .at(-1);

    if (!failedPrompt)
      throw new Error(`DLQ entry ${entry.id} has no user prompt to retry`);

    conversationStore.addExchange(conversation.id, {
      role: 'user',
      content: failedPrompt.content,
      requestId: entry.jobName,
      status: 'done',
      model: filters.model,
      event: filters.event,
      roomId: filters.roomId,
      conversationId: filters.conversationId,
    });
  }

  function prepareAssistantExchange(
    conversation: Conversation,
    entry: DlqEntry,
    filters: DlqEntryFilters,
  ): void {
    const metadata = {
      model: filters.model,
      event: filters.event,
      roomId: filters.roomId,
    };
    const hasAssistant = conversation.exchanges.some(
      (exchange) =>
        exchange.requestId === entry.jobName && exchange.role === 'assistant',
    );

    if (hasAssistant) {
      conversationStore.resetAssistantExchangeForRetry(
        conversation.id,
        entry.jobName,
        metadata,
      );
      return;
    }

    conversationStore.addExchange(conversation.id, {
      role: 'assistant',
      content: '',
      requestId: entry.jobName,
      status: 'pending',
      ...metadata,
      conversationId: filters.conversationId,
    });
  }

  async function prepareRetrySession(
    entry: DlqEntry,
  ): Promise<DlqRetrySession> {
    const filters = extractEntryFilters(entry);
    const conversation = await resolveConversation(entry, filters);

    conversationStore.patchConversation(conversation.id, {
      model: filters.model,
      event: filters.event,
      roomId: filters.roomId,
      numCtx: filters.numCtx ?? conversation.numCtx,
      think: filters.think ?? conversation.think,
      stream: filters.stream ?? conversation.stream,
    });

    seedFailedPromptIfMissing(conversation, entry, filters);
    prepareAssistantExchange(conversation, entry, filters);
    ensureSocketSubscription(filters.roomId, filters.event);

    const session: DlqRetrySession = {
      conversationStoreId: conversation.id,
      requestId: entry.jobName,
      event: filters.event,
      roomId: filters.roomId,
      stream: filters.stream ?? conversation.stream,
    };

    // Pending state must exist before requeueing: a fast worker can emit the
    // response before the reinstate HTTP response reaches the dashboard.
    messagesStore.resetRequestForRetry(
      session.event,
      session.roomId,
      session.requestId,
      session.stream,
    );
    return session;
  }

  function completeRetrySession(session: DlqRetrySession): void {
    debugStore.addDebugResult({
      endpoint: '/api/v1/dlq/reinstate',
      method: 'RETRY',
      status: 'success',
      statusCode: 200,
      responseTime: 0,
      type: 'http',
      requestId: session.requestId,
      ...(session.roomId ? { roomId: session.roomId } : {}),
    });
  }

  function failRetrySession(session: DlqRetrySession): void {
    messagesStore.removeMessage(session.requestId);
    conversationStore.markExchangeError(
      session.conversationStoreId,
      session.requestId,
      i18n.global.t('toast.retryFailed'),
    );
  }

  return {
    prepareRetrySession,
    completeRetrySession,
    failRetrySession,
  };
}
