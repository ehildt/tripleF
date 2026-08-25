import type { ToolResult } from '@triplef/ai-sdk';

import type { FastifyMultipartMeta } from '../dtos/harness-job.dto.js';

export type ExecuteResult = {
  buffers: Buffer[];
  processedMeta: FastifyMultipartMeta[];
  toolResults: ToolResult[];
  inputTokens?: number;
  outputTokens?: number;
};
