import { computed, type Ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

export function useDlqTopBarFilters(
  entry: Ref<DlqEntry | null>,
  availableModels: Ref<string[]>,
) {
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

  return {
    modelValue,
    modelErrored,
    modelOptions,
    eventValue,
    roomIdValue,
    streamValue,
    numCtxValue,
  };
}
