import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { isDlqEntryImmutable } from './is-dlq-entry-immutable.helper';

const makeEntry = (
  payload: DlqEntry['payload'],
  status: DlqEntry['status'] = 'Failed',
): DlqEntry =>
  ({
    requestId: 'req-1',
    queueName: 'harness',
    jobId: null,
    status,
    payload,
    failedReason: null,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    nextRetryAt: null,
    createdAt: '',
  }) as DlqEntry;

describe('isDlqEntryImmutable', () => {
  it('returns true for Removed status', () => {
    expect(isDlqEntryImmutable(makeEntry(null, 'Removed'))).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(isDlqEntryImmutable(makeEntry(null, 'Failed'))).toBe(false);
    expect(isDlqEntryImmutable(makeEntry(null, 'Active'))).toBe(false);
    expect(isDlqEntryImmutable(makeEntry(null, 'Cleared'))).toBe(false);
  });

  it('returns false for a null entry', () => {
    expect(isDlqEntryImmutable(null)).toBe(false);
  });
});
