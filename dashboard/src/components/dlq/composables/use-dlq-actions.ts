import type { UseMutationReturnType } from '@tanstack/vue-query';

import { i18n } from '@/i18n/i18n';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useToast } from '../../../composables/use-toast';
import { useDlqStore } from '../../../stores/dlq';
import { extractEntryFilters } from '../helpers/extract-entry-filters.helper';
import {
  type DlqRetrySessionSocket,
  useDlqRetrySession,
} from './use-dlq-retry-session';

export interface DlqActionsOptions {
  dlqStore: ReturnType<typeof useDlqStore>;
  socketStore: DlqRetrySessionSocket;
  retryMutation: UseMutationReturnType<
    { restored: number; requestIds: string[] },
    Error,
    string,
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

/**
 * DLQ row/detail actions — thin orchestration over the mutations, the
 * store, and the retry-session side effects (socket rooms, conversation
 * seeding, debug log).
 */
export function useDlqActions(options: DlqActionsOptions) {
  const {
    dlqStore,
    retryMutation,
    deleteMutation,
    updateMutation,
    guardedRefetch,
  } = options;

  const toast = useToast();
  const { ensureSocketSubscription, addRetryPendingMessage } =
    useDlqRetrySession(options.socketStore);

  function findEntry(requestId: string) {
    return dlqStore.entries.find((e) => e.requestId === requestId);
  }

  function onSelect(entry: DlqEntry) {
    if (dlqStore.selectedEntry?.requestId !== entry.requestId) {
      dlqStore.markEntryAsRead(entry);
    }
    dlqStore.selectEntry(
      dlqStore.selectedEntry?.requestId === entry.requestId ? null : entry,
    );
  }

  async function onRetry(requestId: string) {
    dlqStore.error = null;
    try {
      const entry = findEntry(requestId);
      const { roomId, event, model } = extractEntryFilters(entry);

      if (roomId && event) ensureSocketSubscription(roomId, event);

      const res = await retryMutation.mutateAsync(requestId);
      toast.success(i18n.global.t('toast.retried', { count: res.restored }));

      for (const reqId of res.requestIds ?? [requestId]) {
        addRetryPendingMessage(reqId, roomId, event, model, entry);
      }

      guardedRefetch();
    } catch {
      toast.error(i18n.global.t('toast.retryFailed'));
    }
  }

  async function onArchive(requestId: string) {
    const entry = findEntry(requestId);
    if (entry && entry.status === 'Removed') return;
    try {
      const updated = await updateMutation.mutateAsync({
        requestId,
        data: { status: 'Cleared' },
      });
      toast.success(i18n.global.t('toast.cleared'));
      dlqStore.updateEntry(updated);
    } catch {
      toast.error(i18n.global.t('toast.archiveFailed'));
    }
  }

  async function onDelete(requestId: string) {
    try {
      await deleteMutation.mutateAsync(requestId);
      toast.success(i18n.global.t('toast.markedForDeletion'));
      if (dlqStore.selectedEntry?.requestId === requestId) {
        dlqStore.selectEntry(null);
      }
      guardedRefetch();
    } catch {
      toast.error(i18n.global.t('toast.deleteFailed'));
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
      toast.success(i18n.global.t('toast.payloadUpdated'));
      dlqStore.updateEntry(updated);
    } catch {
      toast.error(i18n.global.t('toast.payloadUpdateFailed'));
    }
  }

  async function onSaveQueue(requestId: string, queueName: string) {
    try {
      const updated = await updateMutation.mutateAsync({
        requestId,
        data: { queueName },
      });
      toast.success(i18n.global.t('toast.queueUpdated'));
      dlqStore.updateEntry(updated);
    } catch {
      toast.error(i18n.global.t('toast.queueUpdateFailed'));
    }
  }

  return {
    onSelect,
    onRetry,
    onArchive,
    onDelete,
    onSavePayload,
    onSaveQueue,
  };
}
