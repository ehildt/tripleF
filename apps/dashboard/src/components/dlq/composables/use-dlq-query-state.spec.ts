import { beforeEach, describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqQueryState } from './use-dlq-query-state';

function resetControls(): void {
  const state = useDlqQueryState();
  state.filterStatus.value = '';
  state.filterSearch.value = '';
  state.hideRead.value = false;
  state.setPageSize(20);
  state.setPage(1);
  state.selectEntry(null);
}

describe('useDlqQueryState', () => {
  beforeEach(resetControls);

  it('builds typed query params from the shared controls', () => {
    const state = useDlqQueryState();
    state.filterStatus.value = 'Failed';
    state.filterSearch.value = 'room-1';
    state.setPageSize(10);
    state.setPage(2);

    expect(state.getQueryParams()).toEqual({
      status: 'Failed',
      search: 'room-1',
      limit: 10,
      offset: 10,
    });
  });

  it('guards next/previous and resets the page when page size changes', () => {
    const state = useDlqQueryState();
    state.setPageSize(10);

    state.nextPage(35);
    expect(state.offset.value).toBe(10);
    state.nextPage(15);
    expect(state.offset.value).toBe(10);
    state.prevPage();
    expect(state.offset.value).toBe(0);
    state.prevPage();
    expect(state.offset.value).toBe(0);

    state.setPage(3);
    state.setPageSize(25);
    expect(state.limit.value).toBe(25);
    expect(state.offset.value).toBe(0);
  });

  it('shares controls and selected identity across route-owned callers', () => {
    const first = useDlqQueryState();
    first.filterSearch.value = 'persisted';
    first.selectEntry({ id: 'record-1' } as DlqEntry);

    const second = useDlqQueryState();
    expect(second.filterSearch.value).toBe('persisted');
    expect(second.selectedEntryId.value).toBe('record-1');
    expect(second.getQueryParams().search).toBe('persisted');
  });
});
