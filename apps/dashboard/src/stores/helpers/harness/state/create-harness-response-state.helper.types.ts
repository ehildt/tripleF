import type { HarnessResponseData } from '@/types/harness-response-data.model';

export interface HarnessResponseState {
  requestId: string;
  accumulatedDelta: string;
  lastValidData: HarnessResponseData | null;
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
