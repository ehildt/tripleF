import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useModelsStore } from '@/stores/models';
import type { DlqEntry } from '@/types/dlq-entry.model';
import type { OllamaModel } from '@/types/ollama-model.model';

import { useDlqTopBarFilters } from './use-dlq-top-bar-filters';

const makeEntry = (
  payload: DlqEntry['payload'],
  jobName = 'harness-request-1',
): DlqEntry =>
  ({
    requestId: 'req-1',
    queueName: 'harness',
    jobId: null,
    jobName,
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
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns empty model value when there is no payload', () => {
    const entry = ref<DlqEntry | null>(makeEntry(null));
    const { modelValue } = useDlqTopBarFilters(entry, ref([]), ref(false));
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
      const { modelValue } = useDlqTopBarFilters(entry, ref([]), ref(false));
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
      ref(false),
    );
    expect(modelErrored.value).toBe(true);
    expect(modelOptions.value[0]).toBe('unknown');
  });

  it('defaults stream to "false" when not provided', () => {
    const entry = ref<DlqEntry | null>(makeEntry({ filters: {} }));
    const { streamValue } = useDlqTopBarFilters(entry, ref([]), ref(false));
    expect(streamValue.value).toBe('false');
  });

  it('returns an empty numCtx when not set', () => {
    const entry = ref<DlqEntry | null>(makeEntry({ filters: {} }));
    const { numCtxValue } = useDlqTopBarFilters(entry, ref([]), ref(false));
    expect(numCtxValue.value).toBe('');
  });

  it('caps numCtx options at the context length of the entry model', () => {
    const modelsStore = useModelsStore();
    modelsStore.numCtxOptions = [2048, 4096, 8192];
    modelsStore.models = [
      { model: 'llama3', context_length: 4096 } as OllamaModel,
    ];
    const entry = ref<DlqEntry | null>(
      makeEntry({ filters: { model: 'llama3' } }),
    );
    const { numCtxOptions } = useDlqTopBarFilters(
      entry,
      ref(['llama3']),
      ref(false),
    );
    expect(numCtxOptions.value).toEqual(['2048', '4096']);
  });

  it('returns all numCtx options while no models are available', () => {
    const modelsStore = useModelsStore();
    modelsStore.numCtxOptions = [2048, 4096];
    const entry = ref<DlqEntry | null>(
      makeEntry({ filters: { model: 'llama3' } }),
    );
    const { numCtxOptions } = useDlqTopBarFilters(entry, ref([]), ref(false));
    expect(numCtxOptions.value).toEqual(['2048', '4096']);
  });

  it('locks the stream toggle off for memory jobs', () => {
    const entry = ref<DlqEntry | null>(
      makeEntry({ filters: { stream: true } }, 'memory-vectorize'),
    );
    const { isMemoryJob, streamChecked, streamDisabled } = useDlqTopBarFilters(
      entry,
      ref([]),
      ref(false),
    );
    expect(isMemoryJob.value).toBe(true);
    expect(streamChecked.value).toBe(false);
    expect(streamDisabled.value).toBe(true);
  });

  it('disables the stream toggle for immutable entries', () => {
    const entry = ref<DlqEntry | null>(makeEntry({ filters: {} }));
    const { streamDisabled } = useDlqTopBarFilters(entry, ref([]), ref(true));
    expect(streamDisabled.value).toBe(true);
  });
});
