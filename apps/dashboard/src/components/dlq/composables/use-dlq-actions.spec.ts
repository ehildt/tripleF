import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqActions } from './use-dlq-actions';
import type { DlqActionsContext } from './use-dlq-actions.types';
import { useDlqQueryState } from './use-dlq-query-state';
import { useDlqReadState } from './use-dlq-read-state';

const mutationMocks = vi.hoisted(() => ({
  retryMutateAsync: vi.fn(),
  deleteMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
}));
const cacheMocks = vi.hoisted(() => ({ replaceEntry: vi.fn() }));
const sessionMocks = vi.hoisted(() => ({
  prepareRetrySession: vi.fn(),
  completeRetrySession: vi.fn(),
  failRetrySession: vi.fn(),
}));

vi.mock('../../../api/queries/use-retry-dlq-mutation', () => ({
  useRetryDlqMutation: () => ({ mutateAsync: mutationMocks.retryMutateAsync }),
}));
vi.mock('../../../api/queries/use-delete-dlq-mutation', () => ({
  useDeleteDlqMutation: () => ({
    mutateAsync: mutationMocks.deleteMutateAsync,
  }),
}));
vi.mock('../../../api/queries/use-update-dlq-mutation', () => ({
  useUpdateDlqMutation: () => ({
    mutateAsync: mutationMocks.updateMutateAsync,
  }),
}));
vi.mock('@/api/queries/use-dlq-cache', () => ({
  useDlqCache: () => cacheMocks,
}));
vi.mock('./use-dlq-retry-session', () => ({
  useDlqRetrySession: () => sessionMocks,
}));

function makeEntry(overrides: Partial<DlqEntry> = {}): DlqEntry {
  return {
    id: 'rec-1',
    queueName: 'harness',
    jobId: 'job-1',
    jobName: 'req-1',
    status: 'Failed',
    payload: null,
    retryConfig: null,
    failedReason: null,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    failureHistory: null,
    nextRetryAt: null,
    createdAt: '',
    ...overrides,
  };
}

function setupActions(initialEntries: DlqEntry[] = []) {
  const entryList = ref(initialEntries);
  const queryState = useDlqQueryState();
  const entries = computed(() => entryList.value);
  const selectedEntry = computed(() => {
    const id = queryState.selectedEntryId.value;
    return entryList.value.find((entry) => entry.id === id) ?? null;
  });
  const readState = useDlqReadState();
  const dismissError = vi.fn();
  const guardedRefetch = vi.fn();
  const context: DlqActionsContext = {
    entries,
    selectedEntry,
    readState,
    dismissError,
  };
  return {
    actions: useDlqActions(guardedRefetch, context),
    queryState,
    readState,
    selectedEntry,
    guardedRefetch,
    dismissError,
  };
}

describe('useDlqActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    const queryState = useDlqQueryState();
    queryState.filterStatus.value = '';
    queryState.filterSearch.value = '';
    queryState.setPageSize(20);
    queryState.setPage(1);
    queryState.selectEntry(null);
  });

  it('onSelect toggles selection and marks newly selected entries read', () => {
    const entry = makeEntry();
    const { actions, queryState, readState } = setupActions([entry]);

    actions.onSelect(entry);
    expect(queryState.selectedEntryId.value).toBe(entry.id);
    expect(readState.isEntryRead(entry)).toBe(true);

    actions.onSelect(entry);
    expect(queryState.selectedEntryId.value).toBeNull();
  });

  it('onRetry calls the mutation with the record id and refetches', async () => {
    const entry = makeEntry({ queueName: 'vectorize' });
    const { actions, guardedRefetch, dismissError } = setupActions([entry]);
    mutationMocks.retryMutateAsync.mockResolvedValue({
      restored: 1,
      ids: ['rec-1'],
    });

    await actions.onRetry('rec-1');

    expect(dismissError).toHaveBeenCalledOnce();
    expect(mutationMocks.retryMutateAsync).toHaveBeenCalledWith('rec-1');
    expect(guardedRefetch).toHaveBeenCalledOnce();
  });

  it('onRetry dismisses errors but does not refetch when mutation fails', async () => {
    const entry = makeEntry({ queueName: 'vectorize' });
    const { actions, guardedRefetch, dismissError } = setupActions([entry]);
    mutationMocks.retryMutateAsync.mockRejectedValue(new Error('fail'));

    await actions.onRetry('rec-1');

    expect(dismissError).toHaveBeenCalledOnce();
    expect(guardedRefetch).not.toHaveBeenCalled();
  });

  it('onRetry prepares only harness entries and fails an unrestored session', async () => {
    const vectorEntry = makeEntry({
      id: 'rec-v1',
      queueName: 'vectorize',
    });
    const harnessEntry = makeEntry({ id: 'rec-h1', queueName: 'harness' });
    const retrySession = { requestId: 'req-h1' };
    sessionMocks.prepareRetrySession.mockResolvedValue(retrySession);
    mutationMocks.retryMutateAsync.mockResolvedValue({ restored: 0, ids: [] });
    const { actions } = setupActions([vectorEntry, harnessEntry]);

    await actions.onRetry('rec-v1');
    expect(sessionMocks.prepareRetrySession).not.toHaveBeenCalled();

    await actions.onRetry('rec-h1');
    expect(sessionMocks.prepareRetrySession).toHaveBeenCalledWith(harnessEntry);
    expect(sessionMocks.failRetrySession).toHaveBeenCalledWith(retrySession);
    expect(sessionMocks.completeRetrySession).not.toHaveBeenCalled();
  });

  it('onArchive never clears Removed entries', async () => {
    const { actions } = setupActions([
      makeEntry({ id: 'rec-2', status: 'Removed' }),
    ]);

    await actions.onArchive('rec-2');

    expect(mutationMocks.updateMutateAsync).not.toHaveBeenCalled();
  });

  it('onArchive writes the mutation result to the query cache', async () => {
    const entry = makeEntry({ status: 'Failed' });
    const updatedEntry = makeEntry({ status: 'Cleared' });
    mutationMocks.updateMutateAsync.mockResolvedValue(updatedEntry);
    const { actions } = setupActions([entry]);

    await actions.onArchive('rec-1');

    expect(mutationMocks.updateMutateAsync).toHaveBeenCalledWith({
      id: 'rec-1',
      data: { status: 'Cleared' },
    });
    expect(cacheMocks.replaceEntry).toHaveBeenCalledWith(updatedEntry, {
      limit: 20,
      offset: 0,
    });
  });

  it('onDelete clears selection and refetches', async () => {
    const entry = makeEntry({ id: 'rec-xyz' });
    const { actions, queryState, guardedRefetch } = setupActions([entry]);
    queryState.selectEntry(entry);
    mutationMocks.deleteMutateAsync.mockResolvedValue(undefined);

    await actions.onDelete('rec-xyz');

    expect(queryState.selectedEntryId.value).toBeNull();
    expect(guardedRefetch).toHaveBeenCalledOnce();
  });

  it('onSavePayload writes the mutation result to the query cache', async () => {
    const entry = makeEntry();
    const updatedEntry = makeEntry({ payload: { filters: { model: 'x' } } });
    mutationMocks.updateMutateAsync.mockResolvedValue(updatedEntry);
    const { actions } = setupActions([entry]);

    await actions.onSavePayload('rec-1', { filters: { model: 'x' } });

    expect(mutationMocks.updateMutateAsync).toHaveBeenCalledWith({
      id: 'rec-1',
      data: { payload: { filters: { model: 'x' } } },
    });
    expect(cacheMocks.replaceEntry).toHaveBeenCalledWith(updatedEntry, {
      limit: 20,
      offset: 0,
    });
  });
});
