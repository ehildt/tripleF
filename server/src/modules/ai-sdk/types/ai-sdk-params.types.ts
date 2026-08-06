import type { TimeoutConfiguration, ToolSet } from 'ai';

import type { InputMessage } from './ai-sdk-messages.types.js';
import type { ThinkMode } from './think-mode.type.js';

/** A single tool invocation captured from a model step. */
export type ToolResult = { toolName: string; result: unknown };

export type StreamChatParams = {
  model: string;
  messages: InputMessage[];
  numCtx?: number;
  keepAlive?: string;
  think?: ThinkMode;
  tools?: ToolSet;
  timeout?: TimeoutConfiguration<any>;
  abortSignal?: AbortSignal;
  smoothStream?: boolean;
};

export type GenerateChatParams = {
  model: string;
  messages: InputMessage[];
  numCtx?: number;
  keepAlive?: string;
  think?: ThinkMode;
  tools?: ToolSet;
  timeout?: TimeoutConfiguration<any>;
  abortSignal?: AbortSignal;
};

export type CompactContentParams = {
  model: string;
  notify?: (event: string, data?: unknown) => void;
  timeout?: TimeoutConfiguration<any>;
  abortSignal?: AbortSignal;
};

export type GenerateWithToolsParams = {
  model: string;
  messages: InputMessage[];
  numCtx?: number;
  keepAlive?: string;
  think?: ThinkMode;
  tools: ToolSet;
  /**
   * Max generate⇄tool round-trips. Browsing intents navigate, snapshot and
   * interact step by step, so they pass a higher budget than the single
   * round-trip searches use.
   */
  maxSteps?: number;
  timeout?: TimeoutConfiguration<any>;
  abortSignal?: AbortSignal;
  onToolResult?: (toolResult: ToolResult) => void;
};

export type GenerateWithToolsResult = {
  text: string;
  toolResults: ToolResult[];
  totalUsage?: { inputTokens?: number; outputTokens?: number };
};
