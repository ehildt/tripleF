import { useDlqCache } from '@/api/queries/use-dlq-cache';
import { i18n } from '@/i18n/i18n';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDeleteDlqMutation } from '../../../api/queries/use-delete-dlq-mutation';
import { useRetryDlqMutation } from '../../../api/queries/use-retry-dlq-mutation';
import { useUpdateDlqMutation } from '../../../api/queries/use-update-dlq-mutation';
import { useToast } from '../../../composables/use-toast/use-toast';
import type { DlqActions, DlqActionsContext } from './use-dlq-actions.types';
import { useDlqQueryState } from './use-dlq-query-state';
import { useDlqRetrySession } from './use-dlq-retry-session';
import type { DlqRetrySession } from './use-dlq-retry-session.types';

/** Own DLQ row/detail controls and compose mutations, cache, and retry state. */
export function useDlqActions(
  guardedRefetch: () => Promise<void>,
  context: DlqActionsContext,
): DlqActions {
  const queryState = useDlqQueryState();
  const queryCache = useDlqCache();
  const retryMutation = useRetryDlqMutation();
  const deleteMutation = useDeleteDlqMutation();
  const updateMutation = useUpdateDlqMutation();
  const toast = useToast();
  const { prepareRetrySession, completeRetrySession, failRetrySession } =
    useDlqRetrySession();

  function findEntry(id: string): DlqEntry | undefined {
    return context.entries.value.find((entry) => entry.id === id);
  }

  function onSelect(entry: DlqEntry): void {
    if (context.selectedEntry.value?.id !== entry.id) {
      context.readState.markEntryAsRead(entry);
    }
    queryState.selectEntry(
      context.selectedEntry.value?.id === entry.id ? null : entry,
    );
  }

  async function onRetry(id: string): Promise<void> {
    context.dismissError();
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

  async function onArchive(id: string): Promise<void> {
    const entry = findEntry(id);
    if (entry && entry.status === 'Removed') return;
    try {
      const updated = await updateMutation.mutateAsync({
        id,
        data: { status: 'Cleared' },
      });
      toast.success(i18n.global.t('toast.jobArchived'));
      queryCache.replaceEntry(updated, queryState.getQueryParams());
    } catch {
      toast.error(i18n.global.t('toast.archiveFailed'));
    }
  }

  async function onDelete(id: string): Promise<void> {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(i18n.global.t('toast.markedForDeletion'));
      if (context.selectedEntry.value?.id === id) queryState.selectEntry(null);
      guardedRefetch();
    } catch {
      toast.error(i18n.global.t('toast.deleteFailed'));
    }
  }

  async function onSavePayload(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const updated = await updateMutation.mutateAsync({
        id,
        data: { payload },
      });
      toast.success(i18n.global.t('toast.payloadUpdated'));
      queryCache.replaceEntry(updated, queryState.getQueryParams());
    } catch {
      toast.error(i18n.global.t('toast.payloadUpdateFailed'));
    }
  }

  return { onSelect, onRetry, onArchive, onDelete, onSavePayload };
}
