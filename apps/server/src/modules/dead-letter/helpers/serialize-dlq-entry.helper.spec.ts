import { describe, expect, it } from 'vitest';

import type { DeadLetterJob } from '../../../generated/prisma/client.js';

import { serializeDlqEntry } from './serialize-dlq-entry.helper.js';

describe('serializeDlqEntry', () => {
  it('turns Date columns into ISO strings and preserves the rest', () => {
    const row = {
      id: 'rec-1',
      queueName: 'harness',
      jobId: 'job-1',
      jobName: 'req-1',
      status: 'Failed',
      payload: { filters: { model: 'llama3' } },
      retryConfig: null,
      failedReason: 'boom',
      failedAt: new Date('2026-01-15T09:30:00.000Z'),
      attemptsMade: 3,
      totalAttempts: 3,
      failureHistory: [{ at: 'x' }],
      nextRetryAt: new Date('2026-01-15T09:31:00.000Z'),
      createdAt: new Date('2026-01-15T09:00:00.000Z'),
      updatedAt: new Date('2026-01-15T09:30:00.000Z'),
    } as DeadLetterJob;

    expect(serializeDlqEntry(row)).toEqual({
      id: 'rec-1',
      queueName: 'harness',
      jobId: 'job-1',
      jobName: 'req-1',
      status: 'Failed',
      payload: { filters: { model: 'llama3' } },
      retryConfig: null,
      failedReason: 'boom',
      failedAt: '2026-01-15T09:30:00.000Z',
      attemptsMade: 3,
      totalAttempts: 3,
      failureHistory: [{ at: 'x' }],
      nextRetryAt: '2026-01-15T09:31:00.000Z',
      createdAt: '2026-01-15T09:00:00.000Z',
      updatedAt: '2026-01-15T09:30:00.000Z',
    });
  });

  it('keeps null Date columns as null', () => {
    const row = {
      failedAt: null,
      nextRetryAt: null,
    } as unknown as DeadLetterJob;

    const result = serializeDlqEntry(row);

    expect(result.failedAt).toBeNull();
    expect(result.nextRetryAt).toBeNull();
  });
});
