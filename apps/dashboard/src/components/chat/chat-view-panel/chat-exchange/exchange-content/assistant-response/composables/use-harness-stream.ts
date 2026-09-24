import { computed, ref } from 'vue';

import { createHarnessResponseState } from '@/stores/helpers/harness/state/create-harness-response-state.helper';
import { processHarnessResponseEvent } from '@/stores/helpers/harness/state/process-harness-response-event.helper';
import type { HarnessStreamEvent } from '@/types/harness-stream-event.model';

export function useHarnessStream(requestId: string) {
  const state = ref(createHarnessResponseState(requestId));

  function ingest(event: HarnessStreamEvent) {
    state.value = processHarnessResponseEvent(state.value, event);
  }

  function reset() {
    state.value = createHarnessResponseState(requestId);
  }

  const done = computed(() => state.value.done);

  return {
    state,
    done,
    ingest,
    reset,
  };
}
