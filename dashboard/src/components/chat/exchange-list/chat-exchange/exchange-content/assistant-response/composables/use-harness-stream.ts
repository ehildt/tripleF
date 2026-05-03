import { computed, ref } from 'vue';

import type { HarnessStreamEvent } from '@/types/harness-stream-event.model';

import { createHarnessResponseState } from './helpers/create-harness-response-state.helper';
import { processHarnessResponseEvent } from './helpers/process-harness-response-event.helper';

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
