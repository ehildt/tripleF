import type { InputMessage } from '@triplef/ai-sdk';

import type { SharpOptions } from '../../sharp/dtos/sharp-options.dto.js';

import type { Prompt } from './prompt.dto.js';

export type FastifyMultipartFilter = {
  roomId?: string;
  stream: boolean;
  prompt: Array<Prompt>;
  requestId: string;
  sessionId?: string;
  /** Memory partition override (sysctl → system) — the user's memory space: defaults to the session id, a custom value survives browser rotation. */
  memoryPartition?: string;
  /** Memory cognition override (sysctl → system) — the AI's understanding-of-the-user space: defaults to the memory partition. */
  memoryCognition?: string;
  conversationId?: string;
  event: string;
  model: string;
  numCtx: number;
  think: string | boolean;
  hasNewImages?: boolean;
  sessionMetadata?: string;
  preprocessing?: SharpOptions;
  exchanges?: Array<InputMessage>;
  keepAlive?: string;
  /** ISO-639-1 code of the active UI locale (browser-detected or user-selected). */
  language?: string;
  /** Character cap for server-extracted document text (client sysctl, live at submit time). */
  documentTextLimit?: number;
};
