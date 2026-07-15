import { computed, type Ref } from 'vue';

import type { Exchange } from '@/stores/conversation';

import { buildActivityLabel } from '../helpers/build-activity-label.helper';

/**
 * Derive the activity label displayed next to the cancel icon while the
 * assistant exchange is pending ("thinking..", grouped tool activity, or the
 * current pipeline step).
 */
export function useActivityLabel(exchange: Ref<Exchange>) {
  const activityLabel = computed(() =>
    buildActivityLabel({
      reasoning: exchange.value.reasoning,
      toolCalls: exchange.value.toolCalls,
      activity: exchange.value.activity,
    }),
  );

  return { activityLabel };
}
