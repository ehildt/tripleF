import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqListState } from './use-dlq-list-state';

const makeEntry = (overrides: Partial<DlqEntry>): DlqEntry =>
  ({
    requestId: '',
    queueName: 'harness',
    jobId: null,
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

describe('useDlqListState', () => {
  it('produces a sorted list sorted by failedAt descending', () => {
    const entries = ref<DlqEntry[]>([
      makeEntry({ requestId: 'a', failedAt: '2024-01-01T00:00:00Z' }),
      makeEntry({ requestId: 'b', failedAt: '2024-01-03T00:00:00Z' }),
    ]);
    const hideRead = ref(false);
    const { sortedEntries } = useDlqListState({
      entries,
      hideRead,
      isEntryRead: () => false,
    });
    expect(sortedEntries.value.map((e) => e.requestId)).toEqual(['b', 'a']);
  });

  it('reacts to changes in the entries list', async () => {
    const entries = ref<DlqEntry[]>([
      makeEntry({ requestId: 'a', failedAt: '2024-01-01T00:00:00Z' }),
    ]);
    const hideRead = ref(false);
    const { sortedEntries } = useDlqListState({
      entries,
      hideRead,
      isEntryRead: () => false,
    });
    entries.value = [
      ...entries.value,
      makeEntry({ requestId: 'b', failedAt: '2024-01-05T00:00:00Z' }),
    ];
    await nextTick();
    expect(sortedEntries.value.map((e) => e.requestId)).toEqual(['b', 'a']);
  });

  it('reacts to changes in hideRead', async () => {
    const entries = ref<DlqEntry[]>([
      makeEntry({ requestId: 'a', failedAt: '2024-01-01T00:00:00Z' }),
      makeEntry({ requestId: 'b', failedAt: '2024-01-05T00:00:00Z' }),
    ]);
    const hideRead = ref(false);
    const isRead = (e: DlqEntry) => e.requestId === 'a';
    const { sortedEntries } = useDlqListState({
      entries,
      hideRead,
      isEntryRead: isRead,
    });
    hideRead.value = true;
    await nextTick();
    expect(sortedEntries.value.map((e) => e.requestId)).toEqual(['b']);
  });
});
