import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { resolveFailureText } from './resolve-failure-text.helper';

const makeEntry = (failedReason: string | null): DlqEntry =>
  ({
    requestId: 'req-1',
    queueName: 'harness',
    jobId: null,
    status: 'Failed',
    payload: null,
    failedReason,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    nextRetryAt: null,
    createdAt: '',
  }) as DlqEntry;

describe('resolveFailureText', () => {
  it('returns null for a null entry', () => {
    expect(resolveFailureText(null)).toBeNull();
  });

  it('returns null when there is no failedReason', () => {
    expect(resolveFailureText(makeEntry(null))).toBeNull();
  });

  it('returns the reason as-is for plain text', () => {
    expect(resolveFailureText(makeEntry('Plain failure'))).toBe(
      'Plain failure',
    );
  });

  it('unwraps a JSON object using its message field', () => {
    expect(
      resolveFailureText(makeEntry(JSON.stringify({ message: 'boom' }))),
    ).toBe('boom');
  });

  it('falls back to error, then reason, then toString', () => {
    expect(
      resolveFailureText(makeEntry(JSON.stringify({ error: 'oh no' }))),
    ).toBe('oh no');
    expect(
      resolveFailureText(makeEntry(JSON.stringify({ reason: 'why' }))),
    ).toBe('why');
  });

  it('falls back to the original string for malformed JSON', () => {
    expect(resolveFailureText(makeEntry('{not valid'))).toBe('{not valid');
  });
});
