import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { getDlqFilters } from './get-dlq-filters.helper';

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

describe('getDlqFilters', () => {
  it('returns null when there is no payload', () => {
    expect(getDlqFilters(makeEntry(null))).toBeNull();
  });

  it('returns null when the payload has no filters', () => {
    expect(getDlqFilters(makeEntry({}))).toBeNull();
  });

  it('returns the filters record', () => {
    expect(getDlqFilters(makeEntry({ filters: { model: 'a' } }))).toEqual({
      model: 'a',
    });
  });
});
