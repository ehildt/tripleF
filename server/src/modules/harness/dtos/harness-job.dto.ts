import type { InputMessage } from '../../ai-sdk/helpers/ai-sdk-message.models.js';
import type { SharpOptions } from '../../sharp/dtos/sharp-options.dto.js';
import { Prompt } from '../dtos/prompt.dto.js';

export type FastifyMultipartMeta = {
  name: string;
  type: string;
  hash: string;
  variant?: string;
  size?: number;
};

type FastifyMultipartFilter = {
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
  compact?: boolean;
};

export type FastifyMultipartDataWithFiltersReq = {
  buffers: Array<Buffer>;
  meta: Array<FastifyMultipartMeta>;
  filters: Partial<FastifyMultipartFilter>;
};

/** Metadata-only payload stored in BullMQ. Buffers are offloaded to MinIO. */
export type HarnessJobPayload = {
  meta: Array<FastifyMultipartMeta>;
  filters: Partial<
    FastifyMultipartFilter & { think: boolean | 'low' | 'medium' | 'high' }
  >;
};
