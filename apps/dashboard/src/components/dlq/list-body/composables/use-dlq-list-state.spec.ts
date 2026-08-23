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

/** Mirrors the DLQ store's read key. */
const entryReadKey = (e: DlqEntry) =>
  `${e.requestId}::${e.failedAt ?? ''}::${e.attemptsMade}`;

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
      entryReadKey,
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
      entryReadKey,
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
      entryReadKey,
    });
    hideRead.value = true;
    await nextTick();
    expect(sortedEntries.value.map((e) => e.requestId)).toEqual(['b']);
  });

  it('sorts unread entries first using the initial read state', () => {
    const entries = ref<DlqEntry[]>([
      makeEntry({ requestId: 'a', failedAt: '2024-01-01T00:00:00Z' }),
      makeEntry({ requestId: 'b', failedAt: '2024-01-05T00:00:00Z' }),
    ]);
    const hideRead = ref(false);
    const { sortedEntries } = useDlqListState({
      entries,
      hideRead,
      isEntryRead: (e) => e.requestId === 'b',
      entryReadKey,
    });
    expect(sortedEntries.value.map((e) => e.requestId)).toEqual(['a', 'b']);
  });

  it('keeps the order frozen when an entry is marked read on the same page', async () => {
    const entries = ref<DlqEntry[]>([
      makeEntry({ requestId: 'a', failedAt: '2024-01-01T00:00:00Z' }),
      makeEntry({ requestId: 'b', failedAt: '2024-01-05T00:00:00Z' }),
    ]);
    const hideRead = ref(false);
    const readIds = ref<string[]>([]);
    const { sortedEntries } = useDlqListState({
      entries,
      hideRead,
      isEntryRead: (e) => readIds.value.includes(e.requestId),
      entryReadKey,
    });

    // Click: the newer 'b' becomes read in the live tracker — a live sort
    // would drop it below the unread 'a'; the frozen list must not move.
    readIds.value = ['b'];
    entries.value = [...entries.value];
    await nextTick();
    expect(sortedEntries.value.map((e) => e.requestId)).toEqual(['b', 'a']);
  });

  it('re-sorts with the fresh read state when the page data changes', async () => {
    const pageOne = [
      makeEntry({ requestId: 'a', failedAt: '2024-01-01T00:00:00Z' }),
      makeEntry({ requestId: 'b', failedAt: '2024-01-05T00:00:00Z' }),
    ];
    const entries = ref<DlqEntry[]>(pageOne);
    const hideRead = ref(false);
    const readIds = ref<string[]>([]);
    const { sortedEntries } = useDlqListState({
      entries,
      hideRead,
      isEntryRead: (e) => readIds.value.includes(e.requestId),
      entryReadKey,
    });

    readIds.value = ['b'];
    // Pagination: the store replaces the entries with the next page.
    entries.value = [
      makeEntry({ requestId: 'c', failedAt: '2024-01-04T00:00:00Z' }),
      makeEntry({ requestId: 'b', failedAt: '2024-01-05T00:00:00Z' }),
    ];
    await nextTick();
    expect(sortedEntries.value.map((e) => e.requestId)).toEqual(['c', 'b']);
  });

  it('hides entries read during the session only after hideRead re-applies', async () => {
    const entries = ref<DlqEntry[]>([
      makeEntry({ requestId: 'a', failedAt: '2024-01-01T00:00:00Z' }),
      makeEntry({ requestId: 'b', failedAt: '2024-01-05T00:00:00Z' }),
    ]);
    const hideRead = ref(true);
    const readIds = ref<string[]>([]);
    const { sortedEntries } = useDlqListState({
      entries,
      hideRead,
      isEntryRead: (e) => readIds.value.includes(e.requestId),
      entryReadKey,
    });

    // Click while hide-read is on: the row stays visible (no live vanish).
    readIds.value = ['a'];
    entries.value = [...entries.value];
    await nextTick();
    expect(sortedEntries.value.map((e) => e.requestId)).toEqual(['b', 'a']);

    // Re-toggling hide-read is an explicit view change: now it disappears.
    hideRead.value = false;
    await nextTick();
    hideRead.value = true;
    await nextTick();
    expect(sortedEntries.value.map((e) => e.requestId)).toEqual(['b']);
  });
});
