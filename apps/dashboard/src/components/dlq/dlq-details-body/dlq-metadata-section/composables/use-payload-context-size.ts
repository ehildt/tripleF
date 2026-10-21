import { computed, type Ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useModelsStore } from '../../../../../stores/models';

export function usePayloadContextSize(entry: Ref<DlqEntry | null>) {
  const modelsStore = useModelsStore();

  const contextSize = computed(() => {
    const payload = entry.value?.payload as Record<string, unknown> | null;
    const filters = payload?.filters as Record<string, unknown> | undefined;
    const numCtx = filters?.numCtx;
    if (numCtx) return modelsStore.formatCtx(Number(numCtx));
    return '—';
  });

  return { contextSize };
}
