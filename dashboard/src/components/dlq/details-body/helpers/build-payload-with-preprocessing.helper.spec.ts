import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { DEFAULT_PREPROCESSING_SETTINGS } from '../../../../stores/preprocessing';
import { buildPayloadWithPreprocessing } from './build-payload-with-preprocessing.helper';

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

describe('buildPayloadWithPreprocessing', () => {
  it('writes the preprocessing block onto the existing payload', () => {
    const result = buildPayloadWithPreprocessing(
      makeEntry({ filters: { model: 'x' } }),
      { ...DEFAULT_PREPROCESSING_SETTINGS, enabled: true },
    );
    const filters = (result as { filters: Record<string, unknown> }).filters;
    expect(filters.model).toBe('x');
    expect(filters.preprocessing).toBeDefined();
  });

  it('initializes filters when missing', () => {
    const result = buildPayloadWithPreprocessing(makeEntry({}), {
      ...DEFAULT_PREPROCESSING_SETTINGS,
      enabled: true,
    });
    const filters = (result as { filters?: Record<string, unknown> }).filters;
    expect(filters).toBeDefined();
  });
});
