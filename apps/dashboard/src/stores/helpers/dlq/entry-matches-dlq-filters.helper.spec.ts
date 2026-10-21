import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { entryMatchesDlqFilters } from './entry-matches-dlq-filters.helper';

const makeEntry = (overrides: Partial<DlqEntry> = {}): DlqEntry =>
  ({
    id: 'rec-1',
    queueName: 'harness',
    jobId: 'job-1',
    jobName: 'req-1',
    status: 'Failed',
    payload: null,
    retryConfig: null,
    failedReason: null,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    failureHistory: null,
    nextRetryAt: null,
    createdAt: '',
    ...overrides,
  }) as DlqEntry;

describe('entryMatchesDlqFilters', () => {
  it('matches everything when no filters are set', () => {
    expect(entryMatchesDlqFilters(makeEntry(), {})).toBe(true);
  });

  it('matches on exact status', () => {
    expect(entryMatchesDlqFilters(makeEntry(), { status: 'Failed' })).toBe(
      true,
    );
    expect(entryMatchesDlqFilters(makeEntry(), { status: 'Cleared' })).toBe(
      false,
    );
  });

  it('matches a search term against jobName, queueName and failedReason case-insensitively', () => {
    expect(
      entryMatchesDlqFilters(makeEntry({ jobName: 'RequestOne' }), {
        search: 'request',
      }),
    ).toBe(true);
    expect(
      entryMatchesDlqFilters(makeEntry({ queueName: 'VECTORIZE' }), {
        search: 'vector',
      }),
    ).toBe(true);
    expect(
      entryMatchesDlqFilters(makeEntry({ failedReason: 'Model exploded' }), {
        search: 'exploded',
      }),
    ).toBe(true);
  });

  it('matches a search term inside the JSON payload', () => {
    const entry = makeEntry({ payload: { filters: { model: 'llama3' } } });
    expect(entryMatchesDlqFilters(entry, { search: 'llama3' })).toBe(true);
  });

  it('rejects an entry that matches none of the searched fields', () => {
    expect(entryMatchesDlqFilters(makeEntry(), { search: 'missing' })).toBe(
      false,
    );
  });

  it('combines status and search filters', () => {
    const entry = makeEntry({ status: 'Failed', jobName: 'req-1' });
    expect(
      entryMatchesDlqFilters(entry, { status: 'Failed', search: 'req' }),
    ).toBe(true);
    expect(
      entryMatchesDlqFilters(entry, { status: 'Cleared', search: 'req' }),
    ).toBe(false);
  });
});
