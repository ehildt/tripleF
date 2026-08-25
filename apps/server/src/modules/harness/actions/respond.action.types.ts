import type { IntentResult } from '@triplef/agent/schemas';
import type { InputMessage } from '@triplef/ai-sdk';

import type { ThinkMode } from '../../ai-sdk/types/think-mode.type.js';

export type RespondResult = {
  content: string;
  data?: Record<string, unknown>;
  inputTokens?: number;
  outputTokens?: number;
};

export type RespondParams = {
  requestId: string;
  intent: IntentResult;
  messages: InputMessage[];
  availableImages?: Array<Record<string, unknown>>;
  /**
   * Cloud reference images ingested during sanitize, aligned with their
   * availableImages entries — attached visually for verification on
   * describe/compare/ocr.
   */
  cloudReferenceImages?: Array<{
    imageUrl: string;
    title?: string;
    buffer: Buffer;
  }>;
  model: string;
  keepAlive?: string;
  numCtx?: number;
  think?: ThinkMode;
  stream?: boolean;
  abortSignal?: AbortSignal;
  onTextDelta?: (delta: string) => void;
  onReasoningDelta?: (delta: string) => void;
  onJsonRetry?: (attempt: number) => void;
  /** ISO-639-1 code of the active UI locale, used as fallback when the intent classifier left the language unset. */
  language?: string;
};
