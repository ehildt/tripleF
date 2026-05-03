import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { DEFAULT_PREPROCESSING_SETTINGS } from '../../../../stores/preprocessing';
import { useDlqDetailsState } from './use-dlq-details-state';

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

describe('useDlqDetailsState', () => {
  const state = useDlqDetailsState(['llama3', 'mistral']);

  it('modelExists returns true when the model is in the available list', () => {
    expect(state.modelExists(makeEntry({ filters: { model: 'llama3' } }))).toBe(
      true,
    );
  });

  it('modelExists returns false for a model not in the list', () => {
    expect(
      state.modelExists(makeEntry({ filters: { model: 'unknown' } })),
    ).toBe(false);
  });

  it('modelExists returns false for an entry with no model', () => {
    expect(state.modelExists(makeEntry({}))).toBe(false);
  });

  it('isImmutable returns true for Removed entries', () => {
    expect(state.isImmutable(makeEntry({}, 'Removed'))).toBe(true);
  });

  it('isImmutable returns false for other statuses', () => {
    expect(state.isImmutable(makeEntry({}, 'Failed'))).toBe(false);
  });

  it('extractPreprocessing returns the defaults when no block is set', () => {
    expect(state.extractPreprocessing(makeEntry({}))).toEqual(
      DEFAULT_PREPROCESSING_SETTINGS,
    );
  });
});
