import type { HarnessResponseData } from '@/types/harness-response-data.model';

export interface HarnessResponseState {
  requestId: string;
  accumulatedDelta: string;
  lastValidData: HarnessResponseData | null;
  template: string | null;
  text: string;
  done: boolean;
}

export function createHarnessResponseState(
  requestId: string,
): HarnessResponseState {
  return {
    requestId,
    accumulatedDelta: '',
    lastValidData: null,
    template: null,
    text: '',
    done: false,
  };
}
