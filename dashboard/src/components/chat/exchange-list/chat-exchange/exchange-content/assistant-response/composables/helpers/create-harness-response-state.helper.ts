import type { HarnessResponseData } from '@/types/harness-response-data.model';

export interface HarnessResponseState {
  requestId: string;
  accumulatedDelta: string;
  lastValidData: HarnessResponseData | null;
  template: string | null;
  text: string;
  status: string | null;
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
    status: null,
    done: false,
  };
}
