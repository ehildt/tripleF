import type { IntentResult } from '@triplef/agent/schemas';
import type { InputMessage } from '@triplef/ai-sdk';

import type { ThinkMode } from '../../ollama/types/think-mode.type.js';

export type InterpretResult = {
  intent: IntentResult;
  inputTokens?: number;
  outputTokens?: number;
};

export type InterpretParams = {
  requestId: string;
  model: string;
  messages: InputMessage[];
  keepAlive?: string;
  think?: ThinkMode;
  numCtx?: number;
  abortSignal?: AbortSignal;
  onIntent?: (intent: IntentResult) => void;
  /**
   * Streamed reasoning (thinking) deltas from the classifier — forwarded to
   * the client so the "understanding" phase shows thinking just like the
   * respond step does. Absent when the model is not thinking.
   */
  onReasoningDelta?: (delta: string) => void;
  /** ISO-639-1 code of the active UI locale (browser-detected or user-selected). */
  language?: string;
  /**
   * Rendered memory-probe block injected into the classify system message for
   * a second-chance interpretation pass (see InterpretStepService). Absent on
   * the first pass.
   */
  memoryProbe?: string;
  /**
   * The AI's own name (from the cognition persona), injected so the
   * classifier recognizes a bare address ("Shinku?") as a direct call to the
   * AI rather than a familiarity question about a public figure.
   */
  personaName?: string;
};
