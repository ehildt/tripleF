import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { buildSortedDlqEntries } from './build-sorted-dlq-entries.helper';

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

describe('buildSortedDlqEntries', () => {
  const allRead = () => true;
  const allUnread = () => false;

  it('sorts unread entries before read ones', () => {
    const entries = [
      makeEntry({ requestId: 'a', failedAt: '2024-01-02T00:00:00Z' }),
      makeEntry({ requestId: 'b', failedAt: '2024-01-01T00:00:00Z' }),
    ];
    const result = buildSortedDlqEntries(entries, allRead, false);
    expect(result.map((e) => e.requestId)).toEqual(['a', 'b']);
  });

  it('sorts by failedAt descending within the unread group', () => {
    const entries = [
      makeEntry({ requestId: 'old', failedAt: '2024-01-01T00:00:00Z' }),
      makeEntry({ requestId: 'new', failedAt: '2024-01-03T00:00:00Z' }),
      makeEntry({ requestId: 'mid', failedAt: '2024-01-02T00:00:00Z' }),
    ];
    const result = buildSortedDlqEntries(entries, allUnread, false);
    expect(result.map((e) => e.requestId)).toEqual(['new', 'mid', 'old']);
  });

  it('falls back to createdAt when failedAt is null', () => {
    const entries = [
      makeEntry({ requestId: 'a', failedAt: null, createdAt: '2024-01-01' }),
      makeEntry({ requestId: 'b', failedAt: null, createdAt: '2024-01-02' }),
    ];
    const result = buildSortedDlqEntries(entries, allUnread, false);
    expect(result.map((e) => e.requestId)).toEqual(['b', 'a']);
  });

  it('omits read entries when hideRead is true', () => {
    const entries = [
      makeEntry({ requestId: 'a' }),
      makeEntry({ requestId: 'b' }),
    ];
    const isRead = (e: DlqEntry) => e.requestId === 'b';
    const result = buildSortedDlqEntries(entries, isRead, true);
    expect(result.map((e) => e.requestId)).toEqual(['a']);
  });

  it('returns an empty array when there are no entries', () => {
    const result = buildSortedDlqEntries([], allUnread, false);
    expect(result).toEqual([]);
  });
});
