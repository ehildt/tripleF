import { Inject, Injectable, Logger } from '@nestjs/common';

import type { MemoryClientConfig } from '../../../memory-client/configs/memory-client-config.adapter.js';
import { MEMORY_CLIENT_CONFIG } from '../../../memory-client/constants/memory-client.constants.js';
import { MemoryEnqueueService } from '../../../memory-client/services/memory-enqueue.service.js';
import { buildResponseExtractionText } from '../../helpers/extraction/build-response-extraction-text.helper.js';
import { stripThinking } from '../../helpers/extraction/strip-thinking.helper.js';
import type { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

/**
 * The cognition-profile step — enqueue-only: after every answered turn
 * (memory only ever sees successful turns — the engine stops on earlier
 * failures) the turn's two sides are enqueued as a memory-profile job. The
 * worker then maintains the AI's own memory of THIS user: the structured
 * profile document plus derived insight records.
 *
 * Deliberately NOT classifier-gated: derived understanding accrues from
 * ordinary turns ("subconscious formation" — the user never asks for it).
 * Running it as a queue job keeps the extra model call off the turn path and
 * buys BullMQ retries for free. Enqueue errors are logged, never thrown: a
 * cognition hiccup must not fail a turn that already responded.
 */
@Injectable()
export class MemoryProfileStepService implements StepHandler {
  private readonly logger = new Logger(MemoryProfileStepService.name);

  constructor(
    private readonly memoryEnqueue: MemoryEnqueueService,
    @Inject(MEMORY_CLIENT_CONFIG)
    private readonly memoryConfig: MemoryClientConfig,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    const memoryCognition =
      ctx.memoryCognition ?? ctx.memoryPartition ?? ctx.sessionId;
    if (!this.memoryConfig.enabled || !memoryCognition) {
      this.logger.log(
        { requestId: ctx.requestId, step: 'memory-profile' },
        'skipped: memory disabled',
      );
      return;
    }

    // The prose extraction contract of the vectorize step: structured
    // templates stream JSON — the cognition model reads prose, never keys.
    // Reasoning markup is stripped before storage-adjacent persistence.
    const assistantResponse = stripThinking(
      buildResponseExtractionText({
        content: ctx.outputs.finalContent,
        data: ctx.outputs.finalData,
      }),
    );

    await this.memoryEnqueue.enqueueProfileJob({
      memoryCognition,
      memoryPartition: ctx.memoryPartition ?? ctx.sessionId,
      sessionId: ctx.sessionId,
      conversationId: ctx.filters?.conversationId,
      requestId: ctx.requestId,
      userRequest: ctx.lastUserPrompt ?? '',
      assistantResponse,
      model: ctx.model,
      think: false,
      numCtx: ctx.request.options?.num_ctx,
    });
    this.logger.log(
      { requestId: ctx.requestId, step: 'memory-profile' },
      'enqueued',
    );
  }
}
