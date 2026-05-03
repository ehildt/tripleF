import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDlqActions } from './use-dlq-actions';

function mockDlqStore() {
  return {
    entries: [],
    selectedEntry: null,
    selectedRequestIds: new Set<string>(),
    selectedCount: 0,
    error: null as string | null,
    selectEntry: vi.fn(),
    clearSelection: vi.fn(),
    toggleSelection: vi.fn(),
    setAllSelected: vi.fn(),
    markEntryAsRead: vi.fn(),
    updateEntry: vi.fn(),
  } as any;
}

function mockMutation() {
  return {
    mutateAsync: vi.fn().mockResolvedValue({ restored: 1, requestIds: ['a'] }),
  } as any;
}

function makeGuardedRefetch() {
  return vi.fn();
}

function mockSocketStore() {
  return {
    ensureSocketConnection: vi.fn(),
    joinRoom: vi.fn(),
    listenToEvent: vi.fn(),
    connectedEvents: new Set<string>(),
    connectedRooms: new Map<string, Set<string>>(),
  };
}

function makeCommonOptions(overrides: Record<string, unknown> = {}) {
  return {
    dlqStore: mockDlqStore(),
    socketStore: mockSocketStore(),
    retryMutation: mockMutation(),
    reinstateSelectedMutation: mockMutation(),
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

  it('onSelect toggles entry selection', () => {
    const store = mockDlqStore();
    const actions = useDlqActions(makeCommonOptions({ dlqStore: store }));
    const entry = { requestId: 'abc' } as any;
    store.selectedEntry = null;
    actions.onSelect(entry);
    expect(store.selectEntry).toHaveBeenCalledWith(entry);

    store.selectEntry.mockReset();
    store.selectedEntry = entry;
    actions.onSelect(entry);
    expect(store.selectEntry).toHaveBeenCalledWith(null);
  });

  it('onRetry calls mutation and shows success toast', async () => {
    const store = mockDlqStore();
    const guardedRefetch = makeGuardedRefetch();
    const retryMutation = {
      mutateAsync: vi
        .fn()
        .mockResolvedValue({ restored: 1, requestIds: ['abc'] }),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        retryMutation,
        guardedRefetch,
      }),
    );
    await actions.onRetry('abc');
    expect(retryMutation.mutateAsync).toHaveBeenCalledWith('abc');
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
    await actions.onRetry('abc');
    expect(store.error).toBeNull();
  });

  it('onReinstateSelected does nothing when no selection', async () => {
    const store = mockDlqStore();
    store.selectedRequestIds = new Set();
    const reinstateMutation = mockMutation();
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        reinstateSelectedMutation: reinstateMutation,
      }),
    );
    await actions.onReinstateSelected();
    expect(reinstateMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('onReinstateSelected calls mutation with selected ids', async () => {
    const store = mockDlqStore();
    store.selectedRequestIds = new Set(['a', 'b']);
    const reinstateMutation = {
      mutateAsync: vi
        .fn()
        .mockResolvedValue({ restored: 2, requestIds: ['a', 'b'] }),
    } as any;
    const guardedRefetch = makeGuardedRefetch();
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        reinstateSelectedMutation: reinstateMutation,
        guardedRefetch,
      }),
    );
    await actions.onReinstateSelected();
    expect(reinstateMutation.mutateAsync).toHaveBeenCalledWith(['a', 'b']);
    expect(store.clearSelection).toHaveBeenCalledOnce();
    expect(guardedRefetch).toHaveBeenCalledOnce();
  });

  it('onArchive prevents clearing Deleted entries', async () => {
    const store = mockDlqStore();
    store.entries = [{ requestId: 'def', status: 'Removed' }];
    const updateMutation = mockMutation();
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, updateMutation }),
    );
    await actions.onArchive('def');
    expect(updateMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('onArchive calls updateMutation and updateEntry', async () => {
    const store = mockDlqStore();
    store.entries = [{ requestId: 'abc', status: 'Failed' }];
    const updatedEntry = { requestId: 'abc', status: 'Cleared' };
    const updateMutation = {
      mutateAsync: vi.fn().mockResolvedValue(updatedEntry),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, updateMutation }),
    );
    await actions.onArchive('abc');
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      requestId: 'abc',
      data: { status: 'Cleared' },
    });
    expect(store.updateEntry).toHaveBeenCalledWith(updatedEntry);
  });

  it('onDelete clears selection if deleted entry is selected', async () => {
    const store = mockDlqStore();
    store.selectedEntry = { requestId: 'xyz' };
    const deleteMutation = mockMutation();
    const guardedRefetch = makeGuardedRefetch();
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        deleteMutation,
        guardedRefetch,
      }),
    );
    await actions.onDelete('xyz');
    expect(store.clearSelection).toHaveBeenCalledOnce();
    expect(guardedRefetch).toHaveBeenCalledOnce();
  });

  it('onSavePayload calls updateEntry with mutation result', async () => {
    const store = mockDlqStore();
    const updatedEntry = {
      requestId: 'abc',
      payload: { filters: { model: 'x' } },
    };
    const updateMutation = {
      mutateAsync: vi.fn().mockResolvedValue(updatedEntry),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, updateMutation }),
    );
    await actions.onSavePayload('abc', { filters: { model: 'x' } });
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      requestId: 'abc',
      data: { payload: { filters: { model: 'x' } } },
    });
    expect(store.updateEntry).toHaveBeenCalledWith(updatedEntry);
  });

  it('onSaveQueue calls updateEntry with mutation result', async () => {
    const store = mockDlqStore();
    const updatedEntry = { requestId: 'abc', queueName: 'harness' };
    const updateMutation = {
      mutateAsync: vi.fn().mockResolvedValue(updatedEntry),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({ dlqStore: store, updateMutation }),
    );
    await actions.onSaveQueue('abc', 'ocr');
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      requestId: 'abc',
      data: { queueName: 'ocr' },
    });
    expect(store.updateEntry).toHaveBeenCalledWith(updatedEntry);
  });

  it('ensureSocketSubscription resubscribes when event and room missing', async () => {
    const socketStore = mockSocketStore();
    const store = mockDlqStore();
    store.entries = [
      {
        requestId: 'abc',
        payload: { filters: { roomId: 'room1' } },
      },
    ];
    const retryMutation = {
      mutateAsync: vi
        .fn()
        .mockResolvedValue({ restored: 1, requestIds: ['abc'] }),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        socketStore,
        retryMutation,
      }),
    );
    await actions.onRetry('abc');
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
        requestId: 'abc',
        payload: { filters: { roomId: 'room1' } },
      },
    ];
    const retryMutation = {
      mutateAsync: vi
        .fn()
        .mockResolvedValue({ restored: 1, requestIds: ['abc'] }),
    } as any;
    const actions = useDlqActions(
      makeCommonOptions({
        dlqStore: store,
        socketStore,
        retryMutation,
      }),
    );
    await actions.onRetry('abc');
    expect(socketStore.listenToEvent).not.toHaveBeenCalled();
    expect(socketStore.joinRoom).not.toHaveBeenCalled();
  });
});
