import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqTopBarFilters } from './use-dlq-top-bar-filters';

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

describe('useDlqTopBarFilters', () => {
  it('returns empty model value when there is no payload', () => {
    const entry = ref<DlqEntry | null>(makeEntry(null));
    const { modelValue } = useDlqTopBarFilters(entry, ref([]));
    expect(modelValue.value).toBe('');
  });

  it.each([
    [{ filters: { model: 'llama3' } }, 'llama3'],
    [{ filters: { model: 'mistral' } }, 'mistral'],
    [{ filters: { model: '{"model":"json-model"}' } }, 'json-model'],
  ] as Array<[DlqEntry['payload'], string]>)(
    'reads the model value from filters.model',
    (payload, expected) => {
      const entry = ref<DlqEntry | null>(makeEntry(payload));
      const { modelValue } = useDlqTopBarFilters(entry, ref([]));
      expect(modelValue.value).toBe(expected);
    },
  );

  it('marks the model as errored when missing from the available list', () => {
    const entry = ref<DlqEntry | null>(
      makeEntry({ filters: { model: 'unknown' } }),
    );
    const { modelErrored, modelOptions } = useDlqTopBarFilters(
      entry,
      ref(['llama3']),
    );
    expect(modelErrored.value).toBe(true);
    expect(modelOptions.value[0]).toBe('unknown');
  });

  it('defaults stream to "false" when not provided', () => {
    const entry = ref<DlqEntry | null>(makeEntry({ filters: {} }));
    const { streamValue } = useDlqTopBarFilters(entry, ref([]));
    expect(streamValue.value).toBe('false');
  });

  it('returns an empty numCtx when not set', () => {
    const entry = ref<DlqEntry | null>(makeEntry({ filters: {} }));
    const { numCtxValue } = useDlqTopBarFilters(entry, ref([]));
    expect(numCtxValue.value).toBe('');
  });
});
