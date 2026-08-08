import type { HarnessActivityDescriptor } from './harness-activity.model';

export interface MessageData {
  pending?: boolean;
  done?: boolean;
  requestId?: string;
  event?: string;
  roomId?: string;
  stream?: boolean;
  message?: {
    content?: string;
  };
  meta?: Array<{ requestId?: string }>;
  aborted?: boolean;
  canceled?: boolean;
  status?: string;
  /** Structured pipeline activity: an i18n key plus meta, localized by the client. */
  activity?: HarnessActivityDescriptor;
  /** Language the model chose to respond in — activity labels are localized in it. */
  language?: string;
  conversationId?: string;
  promptEvalCount?: number;
  evalCount?: number;
  evalDuration?: number;
  totalDuration?: number;
  reasoningDelta?: string;
  toolCall?: {
    name: string;
    category?: string;
    query?: string;
    input?: unknown;
    status: string;
  };
  /* ── Authoritative structured payload when streaming finishes ───────── */
  data?: Record<string, unknown>;
  template?: string;
  delta?: string;
  prompt?: string;
  images?: Array<Record<string, string>>;
  toolResults?: Array<{ toolName: string; result: unknown }>;
  /** Chart series streamed right after an EODHD tool ran (buffered, then revealed). */
  chartData?: { toolName: string; data: unknown };
  error?: string;
}
