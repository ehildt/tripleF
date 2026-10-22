import type { AssistantActivityDescriptor } from './activity.model';
import type { AssistantToolResult } from './serper-api.model';

export interface AssistantToolCall {
  name: string;
  category?: string;
  query?: string;
  status: string;
}

export interface AssistantStreamEvent {
  requestId?: string;
  template?: string;
  delta?: string;
  status?: string;
  activity?: AssistantActivityDescriptor;
  /** Language the model chose to respond in — activity labels are localized in it. */
  language?: string;
  toolCall?: AssistantToolCall;
  images?: Array<Record<string, string>>;
  toolResults?: AssistantToolResult[];
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
