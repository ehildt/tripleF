import type { HarnessResponseData } from '@/types/harness-response-data.model';

export interface StockmarketListResponseProps {
  /** The raw harness response for the instrument list. */
  data?: HarnessResponseData;
  /** Raw text fallback (unused by the list's structured render). */
  text?: string;
  /** Streamed tool outputs keyed by `tool:ticker` (history, intraday). */
  chartData?: Record<string, unknown>;
  /** Whether the respond step has started streaming (reveals the charts). */
  revealCharts?: boolean;
}
