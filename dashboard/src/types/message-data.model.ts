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
  conversationId?: string;
  promptEvalCount?: number;
  evalCount?: number;
  evalDuration?: number;
  totalDuration?: number;
  phase?:
    'classifying' | 'strategizing' | 'summarizing' | 'rendering' | 'reviewing';
  toolCall?: {
    name: string;
    input?: unknown;
    status: string;
  };
  /* ── Harness streaming JSON response fields ─────────────────────────── */
  template?: string;
  delta?: string;
  prompt?: string;
  images?: Array<Record<string, string>>;
  toolResults?: Array<{ toolName: string; result: unknown }>;
  error?: string;
  compact?: boolean;
}
