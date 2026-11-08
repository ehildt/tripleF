import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, type Ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';
import type { DlqListResponse } from '@/types/dlq-list-response.model';

import type { DlqActionsContext } from './use-dlq-actions.types';
import { useDlqActivity } from './use-dlq-activity';
import { useDlqEntries } from './use-dlq-entries';
import { useDlqQueryState } from './use-dlq-query-state';

const queryMock = vi.hoisted(() => ({})) as {
  data: Ref<DlqListResponse | undefined>;
  error: Ref<Error | null>;
  isError: Ref<boolean>;
  refetch: ReturnType<typeof vi.fn>;
};
const loadingMock = vi.hoisted(() => ({
  guardedRefetch: vi.fn(),
  instantRefetch: vi.fn(),
  onDataArrived: vi.fn(),
  onError: vi.fn(),
})) as typeof loadingMock & { showLoading: Ref<boolean> };
const actionsMock = vi.hoisted(() => ({
  receivedRefetch: undefined as unknown,
  receivedContext: undefined as DlqActionsContext | undefined,
  sentinel: { onSelect: vi.fn() },
}));
const toastMock = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
}));

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
vi.mock('./use-dlq-loading', async () => {
  const { ref } = await import('vue');
  if (!loadingMock.showLoading) loadingMock.showLoading = ref(false);
  return { useDlqLoading: () => loadingMock };
});
vi.mock('./use-dlq-actions', () => ({
  useDlqActions: (
    guardedRefetch: () => Promise<void>,
    context: DlqActionsContext,
  ) => {
    actionsMock.receivedRefetch = guardedRefetch;
    actionsMock.receivedContext = context;
    return actionsMock.sentinel;
  },
}));
vi.mock('../../../composables/use-toast/use-toast', () => ({
  useToast: () => toastMock,
}));

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

function resetQueryState(): void {
  const state = useDlqQueryState();
  state.filterStatus.value = '';
  state.filterSearch.value = '';
  state.hideRead.value = false;
  state.setPageSize(20);
  state.setPage(1);
  state.selectEntry(null);
}

describe('useDlqEntries', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    resetQueryState();
    useDlqActivity().clearDlqActivity();
    queryMock.data.value = undefined;
    queryMock.error.value = null;
    queryMock.isError.value = false;
    loadingMock.showLoading.value = false;
    actionsMock.receivedRefetch = undefined;
    actionsMock.receivedContext = undefined;
  });

  afterEach(() => {
    for (const wrapper of mountedWrappers.splice(0)) wrapper.unmount();
  });

  it('clears DLQ activity when the view mounts', () => {
    const activity = useDlqActivity();
    activity.markDlqActivity();

    mountEntries();

    expect(activity.hasDlqActivity.value).toBe(false);
  });

  it('composes loading, read state, and actions without a data store copy', () => {
    const view = mountEntries();

    expect(actionsMock.receivedRefetch).toBe(loadingMock.guardedRefetch);
    expect(view.actions).toBe(actionsMock.sentinel);
    expect(view.loading).toBe(loadingMock);
    expect(view.readState).toBe(actionsMock.receivedContext?.readState);
  });

  it('derives rows, totals, pages, and selection from query data', async () => {
    const entry = { id: 'rec-1' } as DlqEntry;
    useDlqQueryState().selectEntry(entry);
    const view = mountEntries();

    queryMock.data.value = {
      data: [entry],
      total: 21,
      limit: 20,
      offset: 0,
    };
    await nextTick();

    expect(view.entries.value).toEqual([entry]);
    expect(view.total.value).toBe(21);
    expect(view.currentPage.value).toBe(1);
    expect(view.totalPages.value).toBe(2);
    expect(view.selectedEntry.value?.id).toBe('rec-1');
    expect(loadingMock.onDataArrived).toHaveBeenCalledOnce();
  });

  it('clears selected identity when a page response omits it', async () => {
    useDlqQueryState().selectEntry({ id: 'rec-1' } as DlqEntry);
    const view = mountEntries();

    queryMock.data.value = {
      data: [{ id: 'rec-2' } as DlqEntry],
      total: 1,
      limit: 20,
      offset: 0,
    };
    await nextTick();

    expect(view.selectedEntry.value).toBeNull();
    expect(useDlqQueryState().selectedEntryId.value).toBeNull();
  });

  it('derives query errors and supports retry-local dismissal', async () => {
    const view = mountEntries();
    queryMock.error.value = new Error('Request failed');
    queryMock.isError.value = true;
    await nextTick();

    expect(view.errorMessage.value).toBe('Request failed');
    expect(loadingMock.onError).toHaveBeenCalledOnce();
    expect(toastMock.debug).toHaveBeenCalledWith('Request failed');

    actionsMock.receivedContext?.dismissError();
    await nextTick();
    expect(view.errorMessage.value).toBeNull();

    queryMock.isError.value = false;
    await nextTick();
    expect(view.errorMessage.value).toBeNull();
  });

  it('keeps instant refetch behavior when filters or pagination change', async () => {
    const state = useDlqQueryState();
    mountEntries();

    state.filterSearch.value = 'room1';
    await nextTick();
    expect(loadingMock.instantRefetch).toHaveBeenCalled();

    state.nextPage(40);
    await nextTick();
    expect(loadingMock.instantRefetch).toHaveBeenCalledTimes(2);
  });
});
