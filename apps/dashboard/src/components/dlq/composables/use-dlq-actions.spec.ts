import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqStore } from '../../../stores/dlq';
import { useDlqActions } from './use-dlq-actions';

const mutationMocks = vi.hoisted(() => ({
  retryMutateAsync: vi.fn(),
  deleteMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
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

// The retry-session side effects (socket rooms, conversation seeding, debug
// log) have their own spec — here they are mocked so the action tests stay
// focused on the store/mutation/refetch contract.
const sessionMocks = vi.hoisted(() => ({
  ensureSocketSubscription: vi.fn(),
  addRetryPendingMessage: vi.fn(),
}));

vi.mock('./use-dlq-retry-session', () => ({
  useDlqRetrySession: () => sessionMocks,
}));

const makeEntry = (overrides: Partial<DlqEntry> = {}): DlqEntry =>
  ({
    id: 'rec-1',
    queueName: 'harness',
    jobName: 'req-1',
    status: 'Failed',
    payload: null,
    failedReason: null,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    nextRetryAt: null,
    createdAt: '',
    ...overrides,
  }) as DlqEntry;

describe('useDlqActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('onSelect toggles entry selection and marks newly selected entries read', () => {
    const store = useDlqStore();
    const actions = useDlqActions(vi.fn());
    const entry = makeEntry();

    actions.onSelect(entry);
    expect(store.selectedEntry).toEqual(entry);

    actions.onSelect(entry);
    expect(store.selectedEntry).toBeNull();
  });

  it('onRetry calls the mutation with the record id and refetches', async () => {
    useDlqStore();
    mutationMocks.retryMutateAsync.mockResolvedValue({
      restored: 1,
      ids: ['rec-1'],
    });
    const guardedRefetch = vi.fn();
    const actions = useDlqActions(guardedRefetch);

    await actions.onRetry('rec-1');

    expect(mutationMocks.retryMutateAsync).toHaveBeenCalledWith('rec-1');
    expect(guardedRefetch).toHaveBeenCalledOnce();
  });

  it('onRetry does not refetch when the mutation fails', async () => {
    const store = useDlqStore();
    store.error = 'prev error';
    mutationMocks.retryMutateAsync.mockRejectedValue(new Error('fail'));
    const guardedRefetch = vi.fn();
    const actions = useDlqActions(guardedRefetch);

    await actions.onRetry('rec-1');

    expect(store.error).toBeNull();
    expect(guardedRefetch).not.toHaveBeenCalled();
  });

  it('onRetry seeds the retry session only for harness entries with a room', async () => {
    const store = useDlqStore();
    store.entries = [
      makeEntry({
        id: 'rec-v1',
        queueName: 'vectorize',
        jobName: 'vectorize-1',
        payload: { requestId: 'req-9' },
      }),
      makeEntry({
        id: 'rec-h1',
        queueName: 'harness',
        jobName: 'req-h1',
        payload: { filters: { roomId: 'room1' } },
      }),
    ];
    mutationMocks.retryMutateAsync.mockResolvedValue({ restored: 1, ids: [] });
    const actions = useDlqActions(vi.fn());

    await actions.onRetry('rec-v1');
    expect(sessionMocks.ensureSocketSubscription).not.toHaveBeenCalled();
    expect(sessionMocks.addRetryPendingMessage).not.toHaveBeenCalled();

    await actions.onRetry('rec-h1');
    expect(sessionMocks.ensureSocketSubscription).toHaveBeenCalledWith(
      'room1',
      'harness',
    );
    expect(sessionMocks.addRetryPendingMessage).toHaveBeenCalledOnce();
  });

  it('onArchive never clears Removed entries', async () => {
    const store = useDlqStore();
    store.entries = [makeEntry({ id: 'rec-2', status: 'Removed' })];
    const actions = useDlqActions(vi.fn());

    await actions.onArchive('rec-2');

    expect(mutationMocks.updateMutateAsync).not.toHaveBeenCalled();
  });

  it('onArchive clears the entry and stores the mutation result', async () => {
    const store = useDlqStore();
    store.entries = [makeEntry({ id: 'rec-1', status: 'Failed' })];
    const updatedEntry = makeEntry({ id: 'rec-1', status: 'Cleared' });
    mutationMocks.updateMutateAsync.mockResolvedValue(updatedEntry);
    const actions = useDlqActions(vi.fn());

    await actions.onArchive('rec-1');

    expect(mutationMocks.updateMutateAsync).toHaveBeenCalledWith({
      id: 'rec-1',
      data: { status: 'Cleared' },
    });
    expect(store.entries[0].status).toBe('Cleared');
  });

  it('onDelete clears the selection when the deleted entry was selected', async () => {
    const store = useDlqStore();
    store.selectedEntry = makeEntry({ id: 'rec-xyz' });
    mutationMocks.deleteMutateAsync.mockResolvedValue(undefined);
    const guardedRefetch = vi.fn();
    const actions = useDlqActions(guardedRefetch);

    await actions.onDelete('rec-xyz');

    expect(store.selectedEntry).toBeNull();
    expect(guardedRefetch).toHaveBeenCalledOnce();
  });

  it('onSavePayload stores the mutation result', async () => {
    const store = useDlqStore();
    const entry = makeEntry({ id: 'rec-1' });
    store.entries = [entry];
    const updatedEntry = makeEntry({
      id: 'rec-1',
      payload: { filters: { model: 'x' } },
    });
    mutationMocks.updateMutateAsync.mockResolvedValue(updatedEntry);
    const actions = useDlqActions(vi.fn());

    await actions.onSavePayload('rec-1', { filters: { model: 'x' } });

    expect(mutationMocks.updateMutateAsync).toHaveBeenCalledWith({
      id: 'rec-1',
      data: { payload: { filters: { model: 'x' } } },
    });
    expect(store.entries[0].payload).toEqual({ filters: { model: 'x' } });
  });
});
