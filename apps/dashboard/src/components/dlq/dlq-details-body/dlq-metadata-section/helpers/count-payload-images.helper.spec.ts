import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { countPayloadImages } from './count-payload-images.helper';

const makeEntry = (payload: DlqEntry['payload']): DlqEntry =>
  ({
    requestId: 'req-1',
    queueName: 'harness',
    jobId: null,
    status: 'Failed',
    payload,
    failedReason: null,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    nextRetryAt: null,
    createdAt: '',
  }) as DlqEntry;

describe('countPayloadImages', () => {
  it('returns 0 when there is no payload', () => {
    expect(countPayloadImages(makeEntry(null))).toBe(0);
  });

  it('returns 0 when the payload has no meta array', () => {
    expect(countPayloadImages(makeEntry({ filters: {} }))).toBe(0);
  });

  it('returns the length of the meta array', () => {
    const entry = makeEntry({
      meta: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    });
    expect(countPayloadImages(entry)).toBe(3);
  });
});
