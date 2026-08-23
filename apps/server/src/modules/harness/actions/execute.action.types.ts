import type { ToolResult } from '../../ai-sdk/types/ai-sdk-params.types.js';
import type { FastifyMultipartMeta } from '../dtos/harness-job.dto.js';

export type ExecuteResult = {
  buffers: Buffer[];
  processedMeta: FastifyMultipartMeta[];
  toolResults: ToolResult[];
  inputTokens?: number;
  outputTokens?: number;
};
