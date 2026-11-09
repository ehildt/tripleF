import { computed, type ComputedRef, type Ref } from 'vue';

import { useModelsStore } from '@/stores/models/models.store';
import type { DlqEntry } from '@/types/dlq-entry.model';

interface DlqPayloadWithFilters {
  filters?: Record<string, unknown>;
}

interface DlqTopBarFilters {
  modelValue: ComputedRef<string>;
  modelErrored: ComputedRef<boolean>;
  modelOptions: ComputedRef<string[]>;
  eventValue: ComputedRef<string>;
  roomIdValue: ComputedRef<string>;
  streamValue: ComputedRef<string>;
  numCtxValue: ComputedRef<string>;
  numCtxOptions: ComputedRef<string[]>;
  isMemoryJob: ComputedRef<boolean>;
  streamChecked: ComputedRef<boolean>;
  streamDisabled: ComputedRef<boolean>;
}

/** Derive editable filter values and model-clamped context options for DLQ. */
export function useDlqTopBarFilters(
  entry: Ref<DlqEntry | null>,
  availableModels: Ref<string[]>,
  isImmutable: Ref<boolean>,
): DlqTopBarFilters {
  const modelsStore = useModelsStore();

  function filtersOf(
    selectedEntry: DlqEntry | null,
  ): Record<string, unknown> | null {
    const payload = selectedEntry?.payload as DlqPayloadWithFilters | null;
    return payload?.filters ?? null;
  }

  const filterRecord = computed(() => filtersOf(entry.value));

  const modelValue = computed(() => {
    const filters = filterRecord.value;
    if (!filters) return '';
    const raw = (filters.model as unknown) ?? null;
    if (!raw) return '';
    if (typeof raw === 'object' && raw !== null) {
      const record = raw as Record<string, unknown>;
      return ((record.model as string) || (record.name as string) || '') ?? '';
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
    const filters = filterRecord.value;
    if (!filters) return 'false';
    return String(filters.stream ?? 'false');
  });

  const numCtxValue = computed(() => {
    const value = filterRecord.value?.numCtx;
    if (!value) return '';
    return String(value);
  });

  const numCtxOptions = computed(() => {
    const all = modelsStore.numCtxOptions.map(String);
    if (!availableModels.value.length) return all;
    if (!modelValue.value) return all;
    const model = modelsStore.getModel(modelValue.value);
    if (!model?.context_length) return all;
    return all.filter((option) => Number(option) <= model.context_length!);
  });

  /** Memory jobs (jobName `memory-*`) never stream. */
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
  };
}
