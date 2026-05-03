import { computed, type Ref } from 'vue';

import type { DlqStatus } from '../../../../types/dlq-status.model';

export function useDlqActionAvailability(status: Ref<DlqStatus>) {
  const isRetryable = computed(
    () => status.value === 'Failed' || status.value === 'Cleared',
  );
  const isArchivable = computed(
    () => status.value !== 'Cleared' && status.value !== 'Removed',
  );
  const isDeletable = computed(() => status.value !== 'Removed');
  const isSelectable = computed(() => status.value !== 'Removed');

  return { isRetryable, isArchivable, isDeletable, isSelectable };
}
