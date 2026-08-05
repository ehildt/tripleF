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
  toolCall?: HarnessToolCall;
  images?: Array<Record<string, string>>;
  toolResults?: HarnessToolResult[];
  /** Server-side model-visible (deduped) media — the only media to render/fall back to. */
  availableImages?: Array<{ url: string; title?: string }>;
  availableVideos?: Array<{ url: string; title?: string }>;
  data?: Record<string, unknown>;
  done?: boolean;
}
