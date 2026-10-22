import type { AssistantResponseState } from './create-assistant-response-state.helper.types';

export function createAssistantResponseState(
  requestId: string,
): AssistantResponseState {
  return {
    requestId,
    accumulatedDelta: '',
    lastValidData: null,
    template: null,
    text: '',
    status: null,
    done: false,
    chartData: {},
    revealCharts: false,
  };
}
