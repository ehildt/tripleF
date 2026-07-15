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
  data?: Record<string, unknown>;
  done?: boolean;
}
