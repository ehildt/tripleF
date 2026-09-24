import type { HarnessResponseState } from './create-harness-response-state.helper.types';

export function createHarnessResponseState(
  requestId: string,
): HarnessResponseState {
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
