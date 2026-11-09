import { computed, type ComputedRef, type Ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';
import { formatContextSize } from '@/utils/format-context-size/format-context-size.helper';

interface PayloadContextSize {
  contextSize: ComputedRef<string>;
}

export function usePayloadContextSize(
  entry: Ref<DlqEntry | null>,
): PayloadContextSize {
  const contextSize = computed(() => {
    const payload = entry.value?.payload as Record<string, unknown> | null;
    const filters = payload?.filters as Record<string, unknown> | undefined;
    const numCtx = filters?.numCtx;
    if (numCtx) return formatContextSize(Number(numCtx));
    return '—';
  });

  return { contextSize };
}
