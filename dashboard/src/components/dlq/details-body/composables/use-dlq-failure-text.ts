import { computed, type Ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { parseFailureReason } from '../../helpers/parse-failure-reason.helper';

export function useDlqFailureText(entry: Ref<DlqEntry | null>) {
  const parsed = computed(() => parseFailureReason(entry.value?.failedReason));
  const failureText = computed(() => parsed.value?.text ?? null);
  const failureRaw = computed(() => parsed.value?.raw ?? null);

  return { failureText, failureRaw };
}
