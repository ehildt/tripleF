import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import type { SharpOptions } from '../../sharp/dtos/sharp-options.dto.js';

import type { Prompt } from './prompt.dto.js';

export type FastifyMultipartFilter = {
  roomId?: string;
  stream: boolean;
  prompt: Array<Prompt>;
  requestId: string;
  sessionId?: string;
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
};
