import { createAssistantResponseState } from '@/components/chat/shared/helpers/assistant-response/response-state/create-assistant-response-state.helper';
import type { AssistantResponseState } from '@/components/chat/shared/helpers/assistant-response/response-state/create-assistant-response-state.helper.types';
import { processAssistantResponseEvent } from '@/components/chat/shared/helpers/assistant-response/response-state/process-assistant-response-event.helper';
import type { AssistantStreamEvent } from '@/types/assistant-stream-event.model';

interface HarnessResponseStreams {
  processHarnessStreamEvent: (
    requestId: string,
    event: AssistantStreamEvent,
  ) => AssistantResponseState;
  resetHarnessResponseStream: (requestId: string) => void;
}

const responseStates = new Map<string, AssistantResponseState>();

/**
 * Own the singleton per-request response assembly states shared by socket
 * handling and DLQ retry. States survive route mounts, but each terminal or
 * reset path must release its request id so later retries start cleanly.
 */
export function useHarnessResponseStreams(): HarnessResponseStreams {
  function processHarnessStreamEvent(
    requestId: string,
    event: AssistantStreamEvent,
  ): AssistantResponseState {
    const current =
      responseStates.get(requestId) ?? createAssistantResponseState(requestId);
    const next = processAssistantResponseEvent(current, event);
    responseStates.set(requestId, next);
    return next;
  }

  function resetHarnessResponseStream(requestId: string): void {
    responseStates.delete(requestId);
  }

  return { processHarnessStreamEvent, resetHarnessResponseStream };
}
