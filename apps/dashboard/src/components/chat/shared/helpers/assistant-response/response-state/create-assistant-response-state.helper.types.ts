import type { AssistantResponseData } from '@/types/assistant-response-data.model';

export interface AssistantResponseState {
  requestId: string;
  accumulatedDelta: string;
  lastValidData: AssistantResponseData | null;
  template: string | null;
  text: string;
  status: string | null;
  done: boolean;
  /**
   * Chart data streamed from EODHD tools right after they run, keyed by tool
   * name. Buffered here but hidden until the respond step starts streaming.
   */
  chartData: Record<string, unknown>;
  /** True once the respond step emits its first delta — reveal the charts. */
  revealCharts: boolean;
}
