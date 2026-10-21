import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, type Ref } from 'vue';

import { useDlqStore } from '../../../stores/dlq';
import { useDlqEntries } from './use-dlq-entries';

/** Mutable reactive results of the mocked query/loading dependencies. The
 * mock factories assign the refs once on first call (vi.hoisted runs before
 * vue initializes); tests mutate `.value` between cases to drive the
 * composable's watchers. */
const queryMock = vi.hoisted(() => ({})) as {
  data: Ref<unknown>;
  error: Ref<Error | null>;
  isError: Ref<boolean>;
  refetch: ReturnType<typeof vi.fn>;
};

vi.mock('../../../api/queries/use-dlq-query', async () => {
  const { ref } = await import('vue');
  if (!queryMock.data) {
    queryMock.data = ref(undefined);
    queryMock.error = ref(null);
    queryMock.isError = ref(false);
    queryMock.refetch = vi.fn();
  }
  return { useDlqQuery: () => queryMock };
});

// Loading state machine and actions are covered by their own specs; here
// they are mocked so the entries tests assert only the wiring between them.
const loadingMock = vi.hoisted(() => ({
  guardedRefetch: vi.fn(),
  instantRefetch: vi.fn(),
  onDataArrived: vi.fn(),
  onError: vi.fn(),
})) as typeof loadingMock & { showLoading: Ref<boolean> };

vi.mock('./use-dlq-loading', async () => {
  const { ref } = await import('vue');
  if (!loadingMock.showLoading) loadingMock.showLoading = ref(false);
  return {
    useDlqLoading: () => loadingMock,
  };
});

const actionsMock = vi.hoisted(() => ({
  receivedRefetch: undefined as unknown,
  sentinel: { onSelect: vi.fn() },
}));

vi.mock('./use-dlq-actions', () => ({
  useDlqActions: (guardedRefetch: () => Promise<void>) => {
    actionsMock.receivedRefetch = guardedRefetch;
    return actionsMock.sentinel;
  },
}));

// The composable registers watchers on module-mocked refs — unmount after
// each test so they stop instead of accumulating across tests.
const mountedWrappers: Array<{ unmount: () => void }> = [];

function mountEntries() {
  let captured!: ReturnType<typeof useDlqEntries>;
  const wrapper = mount({
    setup() {
      captured = useDlqEntries();
      return () => null;
    },
  });
  mountedWrappers.push(wrapper);
  return captured;
}

describe('useDlqEntries', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    queryMock.data.value = undefined;
    queryMock.error.value = null;
    queryMock.isError.value = false;
    loadingMock.showLoading.value = false;
  });

  afterEach(() => {
    for (const wrapper of mountedWrappers.splice(0)) {
      wrapper.unmount();
    }
  });

  it('clears the DLQ activity dot when the view mounts', () => {
    const store = useDlqStore();
    store.markDlqActivity();
    mountEntries();
    expect(store.hasDlqActivity).toBe(false);
  });

  it('composes the actions with the loading composable guarded refetch', () => {
    const { actions } = mountEntries();
    expect(actionsMock.receivedRefetch).toBe(loadingMock.guardedRefetch);
    expect(actions).toBe(actionsMock.sentinel);
  });

  it('stores arriving entries and acknowledges the load', async () => {
    const store = useDlqStore();
    mountEntries();

    queryMock.data.value = {
      data: [{ id: 'rec-1' }],
      total: 1,
      limit: 20,
      offset: 0,
    };
    await nextTick();

    expect(store.entries).toEqual([{ id: 'rec-1' }]);
    expect(loadingMock.onDataArrived).toHaveBeenCalledOnce();
  });

  it('stores the error and notifies the loading state on query failure', async () => {
    const store = useDlqStore();
    mountEntries();

    queryMock.error.value = new Error('Request failed');
    queryMock.isError.value = true;
    await nextTick();

    expect(store.error).toBe('Request failed');
    expect(loadingMock.onError).toHaveBeenCalledOnce();

    queryMock.isError.value = false;
    await nextTick();
    expect(store.error).toBeNull();
  });

  it('refetches instantly when filters or pagination change', async () => {
    const store = useDlqStore();
    mountEntries();

    store.filterSearch = 'room1';
    await nextTick();

    expect(loadingMock.instantRefetch).toHaveBeenCalled();
  });

  it('refetches instantly when a bulk DLQ change requests a refresh', async () => {
    const store = useDlqStore();
    mountEntries();

    store.requestEntriesRefresh();
    await nextTick();

    expect(loadingMock.instantRefetch).toHaveBeenCalled();
  });
});
