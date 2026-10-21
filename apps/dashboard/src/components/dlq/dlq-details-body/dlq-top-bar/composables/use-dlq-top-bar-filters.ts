import { computed, type Ref } from 'vue';

import { useModelsStore } from '@/stores/models';
import type { DlqEntry } from '@/types/dlq-entry.model';

/**
 * Derives the editable filter values shown in the DLQ details top bar from
 * the selected entry's payload, and owns the store-backed model/context
 * options the selects need (composables call stores for component-scoped
 * logic so the top-bar leaf stays presentational).
 */
export function useDlqTopBarFilters(
  entry: Ref<DlqEntry | null>,
  availableModels: Ref<string[]>,
  isImmutable: Ref<boolean>,
) {
  const modelsStore = useModelsStore();

  function filtersOf(entry: DlqEntry | null) {
    const payload = entry?.payload;
    if (!payload) return null;
    return (payload as { filters?: Record<string, unknown> })?.filters ?? null;
  }

  const filterRecord = computed(() => filtersOf(entry.value));

  const modelValue = computed(() => {
    const f = filterRecord.value;
    if (!f) return '';
    const raw = (f.model as unknown) ?? null;
    if (!raw) return '';
    if (typeof raw === 'object' && raw !== null) {
      const obj = raw as Record<string, unknown>;
      return ((obj.model as string) || (obj.name as string) || '') ?? '';
    }
    if (
      typeof raw === 'string' &&
      (raw.startsWith('{') || raw.startsWith('['))
    ) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return (parsed.model as string) || (parsed.name as string) || raw;
      } catch {
        return raw;
      }
    }
    return raw as string;
  });

  const modelErrored = computed(
    () =>
      !!modelValue.value && !availableModels.value.includes(modelValue.value),
  );

  const modelOptions = computed(() => {
    if (modelValue.value && !availableModels.value.includes(modelValue.value)) {
      return [modelValue.value, ...availableModels.value];
    }
    return availableModels.value;
  });

  const eventValue = computed(
    () => (filterRecord.value?.event as string) ?? '',
  );

  const roomIdValue = computed(
    () => (filterRecord.value?.roomId as string) ?? '',
  );

  const streamValue = computed(() => {
    const f = filterRecord.value;
    if (!f) return 'false';
    return String(f.stream ?? 'false');
  });

  const numCtxValue = computed(() => {
    const f = filterRecord.value;
    const val = f?.numCtx;
    if (!val) return '';
    return String(val);
  });

  /**
   * Context-size choices from the models store, capped at the context length
   * of the model the entry references so an oversized numCtx is never offered.
   */
  const numCtxOptions = computed(() => {
    const all = modelsStore.numCtxOptions.map(String);
    if (!availableModels.value.length) return all;
    if (!modelValue.value) return all;
    const model = modelsStore.getModel(modelValue.value);
    if (!model?.context_length) return all;
    return all.filter((opt) => Number(opt) <= model.context_length!);
  });

  /** Memory jobs (jobName `memory-*`) never stream — the toggle is locked off. */
  const isMemoryJob = computed(
    () => entry.value?.jobName.startsWith('memory-') ?? false,
  );
  const streamChecked = computed(
    () => !isMemoryJob.value && streamValue.value === 'true',
  );
  const streamDisabled = computed(() => isImmutable.value || isMemoryJob.value);

  return {
    modelValue,
    modelErrored,
    modelOptions,
    eventValue,
    roomIdValue,
    streamValue,
    numCtxValue,
    numCtxOptions,
    isMemoryJob,
    streamChecked,
    streamDisabled,
    localModels: computed(() => modelsStore.localModels),
    cloudModels: computed(() => modelsStore.cloudModels),
    modelsLoading: computed(() => modelsStore.modelsLoading),
  };
}
