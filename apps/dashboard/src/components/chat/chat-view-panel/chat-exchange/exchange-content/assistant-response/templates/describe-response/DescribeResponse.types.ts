import type { AssistantResponseData } from '@/types/assistant-response-data.model';

export interface DescribeResponseProps {
  /** The raw harness response for the template. */
  data: AssistantResponseData;
}
