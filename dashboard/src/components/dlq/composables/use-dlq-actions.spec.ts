import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDlqActions } from './use-dlq-actions';

function mockDlqStore() {
  return {
    entries: [] as any[],
    selectedEntry: null as any,
    error: null as any,
    markEntryAsRead: vi.fn(),
    selectEntry: vi.fn(),
    updateEntry: vi.fn(),
  } as any;
}

function mockSocketStore() {
  return {
    ensureSocketConnection: vi.fn(),
    connectedEvents: new Set<string>(),
    connectedRooms: new Map<string, Set<string>>(),
    listenToEvent: vi.fn(),
    joinRoom: vi.fn(),
  } as any;
}

function mockMutation() {
  return { mutateAsync: vi.fn().mockResolvedValue(undefined) } as any;
}

function makeGuardedRefetch() {
  return vi.fn();
}

function makeCommonOptions(overrides: Record<string, any> = {}) {
  return {
    dlqStore: mockDlqStore(),
    socketStore: mockSocketStore(),
    retryMutation: mockMutation(),
    deleteMutation: mockMutation(),
    updateMutation: mockMutation(),
    guardedRefetch: makeGuardedRefetch(),
    ...overrides,
  };
}

describe('useDlqActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('onSelect toggles entry selection by record id', () => {
    const store = mockDlqStore();
    const actions = useDlqActions(makeCommonOptions({ dlqStore: store }));
    const entry = { id: 'rec-1', jobName: 'abc' } as any;
    store.selectedEntry = null;
    actions.onSelect(entry);
    expect(store.selectEntry).toHaveBeenCalledWith(entry);

    store.selectEntry.mockReset();
    store.selectedEntry = entry;
    actions.onSelect(entry);
    expect(store.selectEntry).toHaveBeenCalledWith(null);
  });

  it('onRetry calls mutation with the record id and refetches', async () => {
    const store = mockDlqStore();
    const guardedRefetch = makeGuardedRefetch();
    const retryMutation = {
      mutateAsync: vi.fn().mockResolvedValue({ restored: 1, ids: ['rec-1'] }),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        retryMutation,
        guardedRefetch,
      }),
    );
    await actions.onRetry('rec-1');
    expect(retryMutation.mutateAsync).toHaveBeenCalledWith('rec-1');
    expect(guardedRefetch).toHaveBeenCalledOnce();
  });

  it('onRetry clears error and shows error toast on failure', async () => {
    const store = mockDlqStore();
    store.error = 'prev error';
    const retryMutation = {
      mutateAsync: vi.fn().mockRejectedValue(new Error('fail')),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, retryMutation }),
    );
    await actions.onRetry('rec-1');
    expect(store.error).toBeNull();
  });

  it('onRetry seeds the retry session only for harness entries', async () => {
    const socketStore = mockSocketStore();
    const store = mockDlqStore();
    // A vectorize entry: no roomId/event in payload — no socket joins.
    store.entries = [
      {
        id: 'rec-v1',
        jobName: 'vectorize',
        queueName: 'vectorize',
        payload: { requestId: 'req-9' },
      },
    ];
    const retryMutation = {
      mutateAsync: vi.fn().mockResolvedValue({ restored: 1, ids: ['rec-v1'] }),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, socketStore, retryMutation }),
    );
    await actions.onRetry('rec-v1');
    expect(socketStore.joinRoom).not.toHaveBeenCalled();
  });

  it('onArchive prevents clearing Removed entries', async () => {
    const store = mockDlqStore();
    store.entries = [{ id: 'rec-2', status: 'Removed' }];
    const updateMutation = mockMutation();
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, updateMutation }),
    );
    await actions.onArchive('rec-2');
    expect(updateMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('onArchive calls updateMutation and updateEntry', async () => {
    const store = mockDlqStore();
    store.entries = [{ id: 'rec-1', status: 'Failed' }];
    const updatedEntry = { id: 'rec-1', status: 'Cleared' };
    const updateMutation = {
      mutateAsync: vi.fn().mockResolvedValue(updatedEntry),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, updateMutation }),
    );
    await actions.onArchive('rec-1');
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: 'rec-1',
      data: { status: 'Cleared' },
    });
    expect(store.updateEntry).toHaveBeenCalledWith(updatedEntry);
  });

  it('onDelete clears selection if deleted entry is selected', async () => {
    const store = mockDlqStore();
    store.selectedEntry = { id: 'rec-xyz' };
    const deleteMutation = mockMutation();
    const guardedRefetch = makeGuardedRefetch();
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        deleteMutation,
        guardedRefetch,
      }),
    );
    await actions.onDelete('rec-xyz');
    expect(store.selectEntry).toHaveBeenCalledWith(null);
    expect(guardedRefetch).toHaveBeenCalledOnce();
  });

  it('onSavePayload calls updateEntry with mutation result', async () => {
    const store = mockDlqStore();
    const updatedEntry = {
      id: 'rec-1',
      payload: { filters: { model: 'x' } },
    };
    const updateMutation = {
      mutateAsync: vi.fn().mockResolvedValue(updatedEntry),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, updateMutation }),
    );
    await actions.onSavePayload('rec-1', { filters: { model: 'x' } });
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: 'rec-1',
      data: { payload: { filters: { model: 'x' } } },
    });
    expect(store.updateEntry).toHaveBeenCalledWith(updatedEntry);
  });

  it('onSaveQueue calls updateEntry with mutation result', async () => {
    const store = mockDlqStore();
    const updatedEntry = { id: 'rec-1', queueName: 'harness' };
    const updateMutation = {
      mutateAsync: vi.fn().mockResolvedValue(updatedEntry),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, updateMutation }),
    );
    await actions.onSaveQueue('rec-1', 'ocr');
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: 'rec-1',
      data: { queueName: 'ocr' },
    });
    expect(store.updateEntry).toHaveBeenCalledWith(updatedEntry);
  });

  it('ensureSocketSubscription resubscribes when event and room missing', async () => {
    const socketStore = mockSocketStore();
    const store = mockDlqStore();
    store.entries = [
      {
        id: 'rec-1',
        jobName: 'abc',
        queueName: 'harness',
        payload: { filters: { roomId: 'room1' } },
      },
    ];
    const retryMutation = {
      mutateAsync: vi.fn().mockResolvedValue({ restored: 1, ids: ['rec-1'] }),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        socketStore,
        retryMutation,
      }),
    );
    await actions.onRetry('rec-1');
    expect(socketStore.ensureSocketConnection).toHaveBeenCalledOnce();
    expect(socketStore.listenToEvent).toHaveBeenCalledWith('harness');
    expect(socketStore.joinRoom).toHaveBeenCalledWith('room1', 'harness');
  });

  it('ensureSocketSubscription skips when already subscribed', async () => {
    const socketStore = mockSocketStore();
    socketStore.connectedEvents.add('harness');
    socketStore.connectedRooms.set('harness', new Set(['room1']));
    const store = mockDlqStore();
    store.entries = [
      {
        id: 'rec-1',
        jobName: 'abc',
        queueName: 'harness',
        payload: { filters: { roomId: 'room1' } },
      },
    ];
    const retryMutation = {
      mutateAsync: vi.fn().mockResolvedValue({ restored: 1, ids: ['rec-1'] }),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        socketStore,
        retryMutation,
      }),
    );
    await actions.onRetry('rec-1');
    expect(socketStore.listenToEvent).not.toHaveBeenCalled();
    expect(socketStore.joinRoom).not.toHaveBeenCalled();
  });
});
