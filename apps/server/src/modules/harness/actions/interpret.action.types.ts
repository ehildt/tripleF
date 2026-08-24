import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import type { ThinkMode } from '../../ai-sdk/types/think-mode.type.js';
import type { IntentResult } from '../templates/intent.schema.js';

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
  /** ISO-639-1 code of the active UI locale (browser-detected or user-selected). */
  language?: string;
  /**
   * Rendered memory-probe block injected into the classify system message for
   * a second-chance interpretation pass (see InterpretStepService). Absent on
   * the first pass.
   */
  memoryProbe?: string;
};
