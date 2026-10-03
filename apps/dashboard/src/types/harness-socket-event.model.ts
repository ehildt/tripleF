import type { SocketEvent } from './socket-event.model';

/**
 * Envelope `type` values the harness pipeline emits on the conversation's
 * own socket channel — a `domain:action` convention per
 * docs/socket-event-bus.md. These are envelope TYPES, not socket.io
 * channels: they ride inside the v1 envelope payload; the channel itself
 * stays the conversation's `event` name (unchanged).
 */
export const HARNESS_EVENT_TYPES = {
  activity: 'harness:activity',
  delta: 'harness:delta',
  toolCall: 'harness:tool-call',
  chart: 'harness:chart',
  completed: 'harness:completed',
  failed: 'harness:failed',
  cancelled: 'harness:cancelled',
} as const;

export type HarnessEventType =
  (typeof HARNESS_EVENT_TYPES)[keyof typeof HARNESS_EVENT_TYPES];

/** Progress descriptor for the current harness step (`harness:activity`). */
export interface HarnessActivityData {
  key: string;
  template?: string;
  language?: string;
}

/**
 * A streamed token chunk (`harness:delta`). `channel` distinguishes the
 * thinking stream (`reasoning`) from the response stream (`content`);
 * `images` accompanies content deltas carrying response-gallery references.
 */
export interface HarnessDeltaData {
  channel: 'content' | 'reasoning';
  text: string;
  template?: string;
  language?: string;
  images?: Array<Record<string, string>>;
}

/** One executed tool call's lifecycle (`harness:tool-call`). */
export interface HarnessToolCallData {
  name: string;
  category?: string;
  query?: string;
  input?: unknown;
  status: string;
  template?: string;
  language?: string;
}

/** Chart series streamed right after an EODHD tool runs (`harness:chart`). */
export interface HarnessChartData {
  toolName: string;
  data: unknown;
  template?: string;
}

/**
 * The terminal harness result (`harness:completed`). `result` is the
 * authoritative final text/JSON; `data` is the validated structured payload;
 * `usage` carries the Ollama token tallies.
 */
export interface HarnessCompletedData {
  template: string;
  result?: string;
  data?: Record<string, unknown>;
  images?: Array<Record<string, string>>;
  toolResults?: Array<{ toolName: string; result: unknown }>;
  availableImages?: Array<{ url: string; title?: string }>;
  availableVideos?: Array<{ url: string; title?: string }>;
  meta?: Array<{ name: string; hash: string; source: string; variant: string }>;
  prompt?: string;
  usage?: { promptEvalCount?: number; evalCount?: number };
}

/** A terminal harness failure (`harness:failed`). */
export interface HarnessFailedData {
  reason: string;
}

/** Ack for a `cancel` command (`harness:cancelled`, kind `reply`). */
export interface HarnessCancelledData {
  success: boolean;
}

/** Discriminated harness bus envelope keyed on `type`. */
export type HarnessSocketEvent =
  | (SocketEvent<HarnessActivityData> & { type: 'harness:activity' })
  | (SocketEvent<HarnessDeltaData> & { type: 'harness:delta' })
  | (SocketEvent<HarnessToolCallData> & { type: 'harness:tool-call' })
  | (SocketEvent<HarnessChartData> & { type: 'harness:chart' })
  | (SocketEvent<HarnessCompletedData> & { type: 'harness:completed' })
  | (SocketEvent<HarnessFailedData> & { type: 'harness:failed' })
  | (SocketEvent<HarnessCancelledData> & { type: 'harness:cancelled' });
