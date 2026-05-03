import type { UseMutationReturnType } from '@tanstack/vue-query';

import { useConversationStore } from '@/stores/conversation';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useToast } from '../../../composables/use-toast';
import { useDebugStore } from '../../../stores/debug';
import { useDlqStore } from '../../../stores/dlq';
import { useApiMessagesStore } from '../../../stores/messages';

export interface DlqActionsOptions {
  dlqStore: ReturnType<typeof useDlqStore>;
  socketStore: {
    ensureSocketConnection: () => void;
    joinRoom: (roomId: string, eventName: string) => void;
    listenToEvent: (eventName: string) => void;
    connectedEvents: Set<string>;
    connectedRooms: Map<string, Set<string>>;
  };
  retryMutation: UseMutationReturnType<
    { restored: number; requestIds: string[] },
    Error,
    string,
    unknown
  >;
  reinstateSelectedMutation: UseMutationReturnType<
    { restored: number; requestIds: string[] },
    Error,
    string[],
    unknown
  >;
  deleteMutation: UseMutationReturnType<void, Error, string, unknown>;
  updateMutation: UseMutationReturnType<
    DlqEntry,
    Error,
    { requestId: string; data: Record<string, unknown> },
    unknown
  >;
  guardedRefetch: () => void;
}

export function useDlqActions(options: DlqActionsOptions) {
  const {
    dlqStore,
    socketStore,
    retryMutation,
    reinstateSelectedMutation,
    deleteMutation,
    updateMutation,
    guardedRefetch,
  } = options;

  const toast = useToast();

  function ensureSocketSubscription(roomId: string, eventName: string) {
    socketStore.ensureSocketConnection();

    const hadEvent = socketStore.connectedEvents.has(eventName);
    const rooms = socketStore.connectedRooms.get(eventName);
    const hadRoom = rooms?.has(roomId) ?? false;

    if (!hadEvent) {
      socketStore.listenToEvent(eventName);
      toast.info(`Resubscribed to ${eventName}`);
    }
    if (!hadRoom) {
      socketStore.joinRoom(roomId, eventName);
      toast.info(`Rejoined room: ${roomId}`);
    }
  }

  function onSelect(entry: DlqEntry) {
    if (dlqStore.selectedEntry?.requestId !== entry.requestId) {
      dlqStore.markEntryAsRead(entry);
    }
    dlqStore.selectEntry(
      dlqStore.selectedEntry?.requestId === entry.requestId ? null : entry,
    );
  }

  function extractFilters(entry: DlqEntry | undefined): {
    roomId: string;
    event: string;
    model: string;
  } {
    const filters = (entry?.payload as Record<string, unknown> | null)?.filters;
    return {
      roomId:
        filters && typeof filters === 'object'
          ? String((filters as { roomId?: string }).roomId ?? '')
          : '',
      event:
        (filters && typeof filters === 'object'
          ? String((filters as { event?: string }).event ?? '')
          : '') || 'harness',
      model:
        filters && typeof filters === 'object'
          ? String((filters as { model?: string }).model ?? '')
          : '',
    };
  }

  function extractPromptMessages(
    entry: DlqEntry | undefined,
  ): { role: string; content: string }[] {
    const payload = entry?.payload as Record<string, unknown> | null;
    const filters = payload?.filters as Record<string, unknown> | undefined;
    const raw = filters?.prompt;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as { role: string; content: string }[];
    if (typeof raw === 'object') {
      const p = raw as { content?: { role: string; content: string }[] };
      if (Array.isArray(p.content)) return p.content;
    }
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (
          parsed &&
          typeof parsed === 'object' &&
          Array.isArray(parsed.content)
        )
          return parsed.content;
      } catch {
        /* intentional */
      }
    }
    return [];
  }

  function populateSessionFromEntry(
    requestId: string,
    roomId: string,
    event: string,
    model: string,
    entry: DlqEntry,
  ) {
    const conversationStore = useConversationStore();
    const conversationId = conversationStore.activeConversationId;
    if (!conversationId) return;
    const conversation = conversationStore.getConversation(conversationId);
    if (!conversation) return;

    if (event) conversation.event = event;
    if (roomId) conversation.roomId = roomId;
    if (model) {
      conversationStore.setModel(conversationId, model);
    }

    const promptMessages = extractPromptMessages(entry);
    const alreadyHaveUser = conversation.exchanges.some(
      (e) => e.requestId === requestId && e.role === 'user',
    );

    if (!alreadyHaveUser) {
      for (const msg of promptMessages) {
        conversationStore.addExchange(conversationId, {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          requestId,
          status: 'done',
          model,
          event,
          roomId,
        });
      }
    }

    const alreadyHaveAssistant = conversation.exchanges.some(
      (e) => e.requestId === requestId && e.role === 'assistant',
    );
    if (!alreadyHaveAssistant) {
      conversationStore.addExchange(conversationId, {
        role: 'assistant',
        content: '',
        requestId,
        status: 'pending',
        model,
        event,
        roomId,
      });
    }
  }

  function addRetryPendingMessage(
    requestId: string,
    roomId: string,
    event: string,
    model: string,
    entry?: DlqEntry,
  ) {
    const debugStore = useDebugStore();
    const store = useApiMessagesStore();
    const conversationStore = useConversationStore();

    debugStore.addDebugResult({
      endpoint: `/api/v1/dlq/${requestId}`,
      method: 'RETRY',
      status: 'success',
      statusCode: 200,
      responseTime: 0,
      type: 'http',
      requestId,
      ...(roomId ? { roomId } : {}),
    });

    const exists = store.messages.some((m) => m.data.requestId === requestId);
    if (!exists) {
      store.trackRequest(requestId);
      store.addPendingMessage(event, roomId, requestId, true);
    }

    if (entry && conversationStore.activeConversationId) {
      populateSessionFromEntry(requestId, roomId, event, model, entry);
    }
  }

  async function onRetry(requestId: string) {
    dlqStore.error = null;
    try {
      const entry = dlqStore.entries.find((e) => e.requestId === requestId);
      const { roomId, event, model } = extractFilters(entry);

      if (roomId && event) ensureSocketSubscription(roomId, event);

      const res = await retryMutation.mutateAsync(requestId);
      toast.success(`Retried ${res.restored} job(s)`);

      for (const reqId of res.requestIds ?? [requestId]) {
        addRetryPendingMessage(reqId, roomId, event, model, entry);
      }

      guardedRefetch();
    } catch {
      toast.error('Retry failed');
    }
  }

  async function onReinstateSelected() {
    if (dlqStore.selectedRequestIds.size === 0) return;
    dlqStore.error = null;
    try {
      const requestIds = [...dlqStore.selectedRequestIds];
      for (const id of requestIds) {
        const entry = dlqStore.entries.find((e) => e.requestId === id);
        const { roomId, event } = extractFilters(entry);
        if (roomId && event) ensureSocketSubscription(roomId, event);
      }

      const res = await reinstateSelectedMutation.mutateAsync(requestIds);
      toast.success(`Reinstated ${res.restored} job(s)`);

      for (const requestId of res.requestIds ?? requestIds) {
        const entry = dlqStore.entries.find((e) => e.requestId === requestId);
        const { roomId, event, model } = extractFilters(entry);
        addRetryPendingMessage(requestId, roomId, event, model, entry);
      }

      dlqStore.clearSelection();
      guardedRefetch();
    } catch {
      toast.error('Reinstate selected failed');
    }
  }

  async function onArchive(requestId: string) {
    const entry = dlqStore.entries.find((e) => e.requestId === requestId);
    if (entry && entry.status === 'Removed') return;
    try {
      const updated = await updateMutation.mutateAsync({
        requestId,
        data: { status: 'Cleared' },
      });
      toast.success('Cleared');
      dlqStore.updateEntry(updated);
    } catch {
      toast.error('Archive failed');
    }
  }

  async function onDelete(requestId: string) {
    try {
      await deleteMutation.mutateAsync(requestId);
      toast.success('Marked for deletion');
      if (dlqStore.selectedEntry?.requestId === requestId) {
        dlqStore.clearSelection();
      }
      guardedRefetch();
    } catch {
      toast.error('Delete failed');
    }
  }

  async function onSavePayload(
    requestId: string,
    payload: Record<string, unknown>,
  ) {
    try {
      const updated = await updateMutation.mutateAsync({
        requestId,
        data: { payload },
      });
      toast.success('Payload updated');
      dlqStore.updateEntry(updated);
    } catch {
      toast.error('Payload update failed');
    }
  }

  async function onSaveQueue(requestId: string, queueName: string) {
    try {
      const updated = await updateMutation.mutateAsync({
        requestId,
        data: { queueName },
      });
      toast.success('Queue updated');
      dlqStore.updateEntry(updated);
    } catch {
      toast.error('Queue update failed');
    }
  }

  return {
    onSelect,
    onRetry,
    onReinstateSelected,
    onArchive,
    onDelete,
    onSavePayload,
    onSaveQueue,
  };
}
