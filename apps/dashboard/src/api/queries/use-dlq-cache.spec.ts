import { QueryClient } from '@tanstack/vue-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';
import type { DlqListResponse } from '@/types/dlq-list-response.model';
import type { DlqQueryParams } from '@/types/dlq-query-params.model';

import { useDlqCache } from './use-dlq-cache';

const queryClientState = vi.hoisted(() => ({
  client: undefined as unknown as QueryClient,
}));

vi.mock('@tanstack/vue-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/vue-query')>();
  return {
    ...actual,
    useQueryClient: () => queryClientState.client,
  };
});

const params: DlqQueryParams = { limit: 20, offset: 0 };
const queryKey = ['dlq', params] as const;

function entry(id: string, status: DlqEntry['status'] = 'Failed'): DlqEntry {
  return {
    id,
    status,
    queueName: 'harness',
    jobName: id,
    payload: null,
    failedReason: null,
  } as DlqEntry;
}

function seedPage(response?: DlqListResponse): void {
  queryClientState.client.setQueryData(
    queryKey,
    response ?? {
      data: [entry('a')],
      total: 1,
      limit: 20,
      offset: 0,
    },
  );
}

describe('useDlqCache', () => {
  beforeEach(() => {
    queryClientState.client = new QueryClient();
  });

  it('updates the current cached page and marks cached pages stale', () => {
    seedPage();
    useDlqCache().applyUpsertedEntry(entry('b'), params);

    const next =
      queryClientState.client.getQueryData<DlqListResponse>(queryKey);
    expect(next?.data.map((item) => item.id)).toEqual(['b', 'a']);
    expect(next?.total).toBe(2);
    expect(queryClientState.client.getQueryState(queryKey)?.isInvalidated).toBe(
      true,
    );
  });

  it('applies removals and mutation replacements to the current page', () => {
    seedPage({
      data: [entry('a'), entry('b')],
      total: 2,
      limit: 20,
      offset: 0,
    });
    const cache = useDlqCache();

    cache.replaceEntry(entry('a', 'Cleared'), params);
    expect(
      queryClientState.client.getQueryData<DlqListResponse>(queryKey)?.data[0]
        .status,
    ).toBe('Cleared');

    cache.applyRemovedEntries(['b'], params);
    expect(
      queryClientState.client
        .getQueryData<DlqListResponse>(queryKey)
        ?.data.map((item) => item.id),
    ).toEqual(['a']);
  });

  it('forwards the requested active/stale refetch policy to TanStack', () => {
    seedPage();
    const invalidate = vi.spyOn(queryClientState.client, 'invalidateQueries');
    const cache = useDlqCache();

    cache.invalidateDlqQueries('none');
    expect(invalidate).toHaveBeenLastCalledWith({
      queryKey: ['dlq'],
      refetchType: 'none',
    });

    cache.invalidateDlqQueries('active');
    expect(invalidate).toHaveBeenLastCalledWith({
      queryKey: ['dlq'],
      refetchType: 'active',
    });
  });
});
