import type { HarnessResponseData } from '@/types/harness-response-data.model';

export interface EvaluationResponseProps {
  /** The raw harness response for the template. */
  data: HarnessResponseData;
}
