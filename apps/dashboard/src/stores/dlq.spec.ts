import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import type { DlqEntry } from '../types/dlq-entry.model';
import { useDlqStore } from './dlq';

const makeEntry = (overrides: Partial<DlqEntry> = {}): DlqEntry =>
  ({
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
  }) as DlqEntry;

describe('useDlqStore live-entry actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('applyUpsertedEntry inserts matching entries on page one and caps at the limit', () => {
    const store = useDlqStore();
    store.total = 0;
    store.limit = 2;
    store.offset = 0;

    store.applyUpsertedEntry(makeEntry({ id: 'a' }));
    store.applyUpsertedEntry(makeEntry({ id: 'b' }));
    store.applyUpsertedEntry(makeEntry({ id: 'c' }));

    expect(store.entries.map((e) => e.id)).toEqual(['c', 'b']);
    expect(store.total).toBe(3);
  });

  it('applyUpsertedEntry replaces an entry already in the list without changing the total', () => {
    const store = useDlqStore();
    store.entries = [makeEntry({ id: 'a', status: 'Failed' })];
    store.total = 1;

    store.applyUpsertedEntry(makeEntry({ id: 'a', status: 'Cleared' }));

    expect(store.entries[0].status).toBe('Cleared');
    expect(store.total).toBe(1);
  });

  it('applyUpsertedEntry removes an entry that falls out of the active filters', () => {
    const store = useDlqStore();
    store.entries = [makeEntry({ id: 'a', status: 'Failed' })];
    store.total = 1;
    store.filterStatus = 'Failed';

    store.applyUpsertedEntry(makeEntry({ id: 'a', status: 'Cleared' }));

    expect(store.entries).toEqual([]);
    expect(store.total).toBe(0);
  });

  it('applyUpsertedEntry increments the total but does not insert off the first page', () => {
    const store = useDlqStore();
    store.total = 20;
    store.offset = 20;

    store.applyUpsertedEntry(makeEntry({ id: 'a' }));

    expect(store.entries).toEqual([]);
    expect(store.total).toBe(21);
  });

  it('applyRemovedEntries drops listed ids and decrements the total', () => {
    const store = useDlqStore();
    store.entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })];
    store.total = 2;

    store.applyRemovedEntries(['a']);

    expect(store.entries.map((e) => e.id)).toEqual(['b']);
    expect(store.total).toBe(1);
  });

  it('requestEntriesRefresh bumps the refresh nonce', () => {
    const store = useDlqStore();
    expect(store.entriesRefreshNonce).toBe(0);

    store.requestEntriesRefresh();

    expect(store.entriesRefreshNonce).toBe(1);
  });
});
