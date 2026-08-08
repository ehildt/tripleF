import type { HarnessActivityDescriptor } from './harness-activity.model';
import type { HarnessToolResult } from './serper-api.model';

export interface HarnessToolCall {
  name: string;
  category?: string;
  query?: string;
  status: string;
}

export interface HarnessStreamEvent {
  requestId?: string;
  template?: string;
  delta?: string;
  status?: string;
  activity?: HarnessActivityDescriptor;
  /** Language the model chose to respond in — activity labels are localized in it. */
  language?: string;
  toolCall?: HarnessToolCall;
  images?: Array<Record<string, string>>;
  toolResults?: HarnessToolResult[];
  /**
   * Large chart data (OHLCV, technical series) streamed right after an EODHD
   * tool runs. The client buffers it and reveals it once the respond step
   * starts streaming — the model never sees the raw series.
   */
  chartData?: { toolName: string; data: unknown };
  /** Server-side model-visible (deduped) media — the only media to render/fall back to. */
  availableImages?: Array<{ url: string; title?: string }>;
  availableVideos?: Array<{ url: string; title?: string }>;
  data?: Record<string, unknown>;
  done?: boolean;
}
