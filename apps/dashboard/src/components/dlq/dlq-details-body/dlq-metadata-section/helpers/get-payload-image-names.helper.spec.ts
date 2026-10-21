import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { getPayloadImageNames } from './get-payload-image-names.helper';

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

describe('getPayloadImageNames', () => {
  it('returns an em-dash when the payload has no images', () => {
    expect(getPayloadImageNames(makeEntry(null))).toBe('—');
    expect(getPayloadImageNames(makeEntry({ meta: [] }))).toBe('—');
  });

  it('joins the names with a comma', () => {
    const entry = makeEntry({
      meta: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    });
    expect(getPayloadImageNames(entry)).toBe('a, b, c');
  });

  it('uses "unnamed" as a fallback when a meta entry has no name', () => {
    const entry = makeEntry({ meta: [{}, { name: 'b' }] });
    expect(getPayloadImageNames(entry)).toBe('unnamed, b');
  });
});
