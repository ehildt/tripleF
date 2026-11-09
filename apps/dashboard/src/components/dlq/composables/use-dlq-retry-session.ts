import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationExchangeCompletion } from '@/components/chat/composables/use-conversation-exchange-completion';
import { useConversationTurns } from '@/components/chat/composables/use-conversation-turns';
import { useHarnessResponseStreams } from '@/components/chat/composables/use-harness-response-streams';
import { useSocket } from '@/composables/use-socket/use-socket';
import { i18n } from '@/i18n/i18n';
import type { Conversation } from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { useDebugStore } from '@/stores/debug/debug.store';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useToast } from '../../../composables/use-toast/use-toast';
import { buildRecoveredConversation } from '../helpers/build-recovered-conversation.helper';
import { extractEntryFilters } from '../helpers/extract-entry-filters.helper';
import type { DlqEntryFilters } from '../helpers/extract-entry-filters.helper.types';
import { extractPromptMessages } from '../helpers/extract-prompt-messages.helper';
import type { DlqRetrySession } from './use-dlq-retry-session.types';

interface DlqRetrySessionController {
  prepareRetrySession: (entry: DlqEntry) => Promise<DlqRetrySession>;
  completeRetrySession: (session: DlqRetrySession) => void;
  failRetrySession: (session: DlqRetrySession) => void;
}

/** Prepare an existing or recovered conversation for a harness DLQ replay. */
export function useDlqRetrySession(): DlqRetrySessionController {
  const socketStore = useSocket();
  const conversationStore = useConversationStore();
  const catalog = useConversationCatalog();
  const turns = useConversationTurns();
  const completion = useConversationExchangeCompletion();
  const debugStore = useDebugStore();
  const responseStreams = useHarnessResponseStreams();
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
      return catalog.restoreConversation(buildRecoveredConversation(entry));

    const loaded = await catalog.loadConversationForWrite(existing.id);
    if (!loaded)
      throw new Error(
        `Conversation ${filters.conversationId} could not be loaded for retry`,
      );

    return loaded;
  }

  async function prepareRetrySession(
    entry: DlqEntry,
  ): Promise<DlqRetrySession> {
    const filters = extractEntryFilters(entry);
    const conversation = await resolveConversation(entry, filters);
    const hasFailedTurn = conversation.exchanges.some(
      (exchange) => exchange.requestId === entry.jobName,
    );
    let failedPrompt: string | undefined;
    if (!hasFailedTurn) {
      const prompt = extractPromptMessages(entry)
        .filter((message) => message.role === 'user')
        .at(-1);

      if (!prompt)
        throw new Error(`DLQ entry ${entry.id} has no user prompt to retry`);

      failedPrompt = prompt.content;
    }

    await turns.prepareConversationRetry({
      conversationStoreId: conversation.id,
      requestId: entry.jobName,
      serverConversationId: filters.conversationId,
      model: filters.model,
      event: filters.event,
      roomId: filters.roomId,
      numCtx: filters.numCtx ?? conversation.numCtx,
      think: filters.think ?? conversation.think,
      stream: filters.stream ?? conversation.stream,
      ...(failedPrompt !== undefined ? { failedPrompt } : {}),
      defaultTitle: i18n.global.t('common.newConversation'),
    });
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
    responseStreams.resetHarnessResponseStream(session.requestId);
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
    responseStreams.resetHarnessResponseStream(session.requestId);
    void completion.markExchangeError(
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
