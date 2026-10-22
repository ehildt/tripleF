import { computed, ref } from 'vue';

import { createAssistantResponseState } from '@/stores/helpers/assistant-response/response-state/create-assistant-response-state.helper';
import { processAssistantResponseEvent } from '@/stores/helpers/assistant-response/response-state/process-assistant-response-event.helper';
import type { AssistantStreamEvent } from '@/types/assistant-stream-event.model';

export function useAssistantStream(requestId: string) {
  const state = ref(createAssistantResponseState(requestId));

  function ingest(event: AssistantStreamEvent) {
    state.value = processAssistantResponseEvent(state.value, event);
  }

  function reset() {
    state.value = createAssistantResponseState(requestId);
  }

  const done = computed(() => state.value.done);

  return {
    state,
    done,
    ingest,
    reset,
  };
}
