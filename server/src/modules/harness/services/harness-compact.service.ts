import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import type { InputMessage } from '../../ai-sdk/helpers/ai-sdk-message.models.js';
import { normalizeThink } from '../../ai-sdk/helpers/ollama.helpers.js';
import { HarnessJobPayload } from '../dtos/harness-job.dto.js';
import { buildModeSystemPrompt } from '../prompts/base-system.prompt.js';

import { HarnessChatStreamingService } from './harness-chat-streaming.service.js';

@Injectable()
export class HarnessCompactService {
  constructor(
    @Inject(HarnessChatStreamingService)
    private readonly chatStreaming: HarnessChatStreamingService,
  ) {}

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

    const messages: InputMessage[] = [
      {
        role: 'system' as const,
        content: buildModeSystemPrompt({ mode: 'compact', hasImages: false }),
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
