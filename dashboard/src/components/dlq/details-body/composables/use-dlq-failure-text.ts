import { computed, type Ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { resolveFailureText } from '../helpers/resolve-failure-text.helper';

export function useDlqFailureText(entry: Ref<DlqEntry | null>) {
  const failureText = computed(() => resolveFailureText(entry.value));

  return { failureText };
}
