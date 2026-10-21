import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { getDlqModel } from './get-dlq-model.helper';

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

describe('getDlqModel', () => {
  it('returns null when there are no filters', () => {
    expect(getDlqModel(makeEntry(null))).toBeNull();
  });

  it('reads from filters.model', () => {
    expect(getDlqModel(makeEntry({ filters: { model: 'llama3' } }))).toBe(
      'llama3',
    );
  });

  it('reads a second model from filters.model', () => {
    expect(getDlqModel(makeEntry({ filters: { model: 'mistral' } }))).toBe(
      'mistral',
    );
  });

  it('parses a JSON string model', () => {
    expect(
      getDlqModel(makeEntry({ filters: { model: '{"model":"json-model"}' } })),
    ).toBe('json-model');
  });
});
