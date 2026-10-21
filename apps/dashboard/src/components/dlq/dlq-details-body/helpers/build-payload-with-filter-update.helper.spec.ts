import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { buildPayloadWithFilterUpdate } from './build-payload-with-filter-update.helper';

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

describe('buildPayloadWithFilterUpdate', () => {
  it('updates an existing filter value', () => {
    const result = buildPayloadWithFilterUpdate(
      makeEntry({ filters: { model: 'old' } }),
      'model',
      'new',
    );
    const filters = (result as { filters: Record<string, unknown> }).filters;
    expect(filters.model).toBe('new');
  });

  it('creates the filters block when missing', () => {
    const result = buildPayloadWithFilterUpdate(makeEntry({}), 'model', 'new');
    const filters = (result as { filters?: Record<string, unknown> }).filters;
    expect(filters?.model).toBe('new');
  });
});
