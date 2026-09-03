import { i18n } from '@/i18n/i18n';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useToast } from '../../../composables/use-toast';
import { extractEntryFilters } from '../helpers/extract-entry-filters.helper';
import type { DlqActionsOptions } from './use-dlq-actions.types';
import { useDlqRetrySession } from './use-dlq-retry-session';

/**
 * DLQ row/detail actions — thin orchestration over the mutations, the
 * store, and the retry-session side effects (socket rooms, conversation
 * seeding, debug log). Entries are identified by their DLQ record id; the
 * socket/conversation tracking uses the entry's jobName (for harness turns
 * that name IS the originating request id).
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

  function findEntry(id: string) {
    return dlqStore.entries.find((e) => e.id === id);
  }

  function onSelect(entry: DlqEntry) {
    if (dlqStore.selectedEntry?.id !== entry.id) {
      dlqStore.markEntryAsRead(entry);
    }
    dlqStore.selectEntry(
      dlqStore.selectedEntry?.id === entry.id ? null : entry,
    );
  }

  async function onRetry(id: string) {
    dlqStore.error = null;
    try {
      const entry = findEntry(id);
      // Session seeding only makes sense for harness turns — a reinstated
      // harness job streams back under its request id (= jobName). Background
      // queue records (vectorize, ...) just re-run silently.
      const isHarnessTurn = entry?.queueName === 'harness';
      const { roomId, event, model } = extractEntryFilters(entry);

      if (isHarnessTurn && roomId && event)
        ensureSocketSubscription(roomId, event);

      const res = await retryMutation.mutateAsync(id);
      toast.success(i18n.global.t('toast.retried', { count: res.restored }));

      if (entry && isHarnessTurn) {
        addRetryPendingMessage(entry.jobName, roomId, event, model, entry);
      }

      guardedRefetch();
    } catch {
      toast.error(i18n.global.t('toast.retryFailed'));
    }
  }

  async function onArchive(id: string) {
    const entry = findEntry(id);
    if (entry && entry.status === 'Removed') return;
    try {
      const updated = await updateMutation.mutateAsync({
        id,
        data: { status: 'Cleared' },
      });
      toast.success(i18n.global.t('toast.jobArchived'));
      dlqStore.updateEntry(updated);
    } catch {
      toast.error(i18n.global.t('toast.archiveFailed'));
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(i18n.global.t('toast.markedForDeletion'));
      if (dlqStore.selectedEntry?.id === id) {
        dlqStore.selectEntry(null);
      }
      guardedRefetch();
    } catch {
      toast.error(i18n.global.t('toast.deleteFailed'));
    }
  }

  async function onSavePayload(id: string, payload: Record<string, unknown>) {
    try {
      const updated = await updateMutation.mutateAsync({
        id,
        data: { payload },
      });
      toast.success(i18n.global.t('toast.payloadUpdated'));
      dlqStore.updateEntry(updated);
    } catch {
      toast.error(i18n.global.t('toast.payloadUpdateFailed'));
    }
  }

  async function onSaveQueue(id: string, queueName: string) {
    try {
      const updated = await updateMutation.mutateAsync({
        id,
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
