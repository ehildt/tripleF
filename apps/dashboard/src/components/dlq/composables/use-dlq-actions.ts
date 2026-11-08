import { i18n } from '@/i18n/i18n';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDeleteDlqMutation } from '../../../api/queries/use-delete-dlq-mutation';
import { useRetryDlqMutation } from '../../../api/queries/use-retry-dlq-mutation';
import { useUpdateDlqMutation } from '../../../api/queries/use-update-dlq-mutation';
import { useToast } from '../../../composables/use-toast/use-toast';
import { useDlqStore } from '../../../stores/dlq/dlq.store';
import { useDlqRetrySession } from './use-dlq-retry-session';
import type { DlqRetrySession } from './use-dlq-retry-session.types';

/**
 * DLQ row/detail actions — thin orchestration over the mutations, the store,
 * and the retry-session side effects (socket rooms, conversation seeding,
 * debug log). Entries are identified by their DLQ record id; the
 * socket/conversation tracking uses the entry's jobName (for harness turns
 * that name IS the originating request id). Stores and mutation hooks are
 * resolved by import; the only parameter is the caller's refetch callback so
 * the list refreshes after a mutation.
 */
export function useDlqActions(guardedRefetch: () => Promise<void>) {
  const dlqStore = useDlqStore();
  const retryMutation = useRetryDlqMutation();
  const deleteMutation = useDeleteDlqMutation();
  const updateMutation = useUpdateDlqMutation();
  const toast = useToast();
  const { prepareRetrySession, completeRetrySession, failRetrySession } =
    useDlqRetrySession();

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
    let retrySession: DlqRetrySession | undefined;
    try {
      const entry = findEntry(id);
      if (!entry) throw new Error(`DLQ entry ${id} is not loaded`);

      if (entry.queueName === 'harness') {
        retrySession = await prepareRetrySession(entry);
      }

      const res = await retryMutation.mutateAsync(id);
      if (!res.ids.includes(id)) {
        throw new Error(`DLQ entry ${id} was not restored`);
      }

      if (retrySession) completeRetrySession(retrySession);
      toast.success(i18n.global.t('toast.retried', { count: res.restored }));
      void guardedRefetch();
    } catch {
      if (retrySession) failRetrySession(retrySession);
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

  return {
    onSelect,
    onRetry,
    onArchive,
    onDelete,
    onSavePayload,
  };
}
