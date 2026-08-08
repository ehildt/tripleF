import type { HarnessResponseData } from '@/types/harness-response-data.model';

export interface StockmarketItemResponseProps {
  /** The raw harness response for the instrument. */
  data?: HarnessResponseData;
  /** Raw text fallback (unused by the card's structured render). */
  text?: string;
  /** Streamed tool outputs keyed by `tool:ticker` (history, intraday). */
  chartData?: Record<string, unknown>;
  /** Whether the respond step has started streaming (reveals the chart). */
  revealCharts?: boolean;
}
