import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { normalizeThink } from '../../ai-sdk/helpers/normalize-think.helper.js';
import type { InputMessage } from '../../ai-sdk/types/ai-sdk-messages.types.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import {
  getOptionalKeys,
  getRequiredKeys,
} from '../helpers/template-placeholders.constant.js';
import { buildContentSystemPrompt } from '../prompts/content-system.prompt.js';
import { resolveVariantInstructions } from '../prompts/variant-instructions.registry.js';

import { HarnessChatStreamingService } from './harness-chat-streaming.service.js';

@Injectable()
export class HarnessCompactService {
  constructor(private readonly chatStreaming: HarnessChatStreamingService) {}

  async runCompact(
    job: Job<HarnessJobPayload>,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    const filters = job.data.filters;

    const model = filters.model!;
    const requestId = filters.requestId ?? job.name;
    const roomId = filters.roomId;
    const stream = filters.stream ?? false;
    const event = filters.event!;
    const keepAlive = filters.keepAlive;
    const numCtx = filters.numCtx;
    const think = normalizeThink(filters.think);
    const exchanges = filters.exchanges;

    const instructions = resolveVariantInstructions('compact', 'default');

    const messages: InputMessage[] = [
      {
        role: 'system' as const,
        content: buildContentSystemPrompt({
          template: 'compact',
          instructions,
          tools: [],
          requiredKeys: getRequiredKeys('compact'),
          optionalKeys: getOptionalKeys('compact'),
          isImageTask: false,
        }),
      },
      ...(exchanges ?? []),
    ];

    await this.chatStreaming.streamCompact({
      requestId,
      roomId,
      event,
      model,
      messages,
      keepAlive,
      numCtx,
      think,
      stream,
      abortSignal,
    });
  }
}
