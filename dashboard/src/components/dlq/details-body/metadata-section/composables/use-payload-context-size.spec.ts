import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { usePayloadContextSize } from './use-payload-context-size';

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

describe('usePayloadContextSize', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns an em-dash when there is no payload', () => {
    const entry = ref<DlqEntry | null>(makeEntry(null));
    const { contextSize } = usePayloadContextSize(entry);
    expect(contextSize.value).toBe('—');
  });

  it('returns an em-dash when the filters have no numCtx', () => {
    const entry = ref<DlqEntry | null>(makeEntry({ filters: {} }));
    const { contextSize } = usePayloadContextSize(entry);
    expect(contextSize.value).toBe('—');
  });

  it('formats the numCtx value from the filters', () => {
    const entry = ref<DlqEntry | null>(
      makeEntry({ filters: { numCtx: 4096 } }),
    );
    const { contextSize } = usePayloadContextSize(entry);
    expect(contextSize.value).toBeTruthy();
    expect(contextSize.value).not.toBe('—');
  });
});
