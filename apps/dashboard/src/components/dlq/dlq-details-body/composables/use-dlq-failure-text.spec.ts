import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqFailureText } from './use-dlq-failure-text';

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

describe('useDlqFailureText', () => {
  it('returns null for a null entry', () => {
    const entry = ref<DlqEntry | null>(null);
    const { failureText } = useDlqFailureText(entry);
    expect(failureText.value).toBeNull();
  });

  it('returns the formatted message for a JSON object reason', () => {
    const entry = ref<DlqEntry | null>(
      makeEntry(JSON.stringify({ message: 'Bad input' })),
    );
    const { failureText } = useDlqFailureText(entry);
    expect(failureText.value).toBe('Bad input');
  });
});
