import { Injectable, Logger } from '@nestjs/common';

import { MemoryEnqueueService } from '../../../memory-client/services/memory-enqueue.service.js';
import { buildResponseExtractionText } from '../../helpers/extraction/build-response-extraction-text.helper.js';
import { stripThinking } from '../../helpers/extraction/strip-thinking.helper.js';
import type { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

/**
 * The memory write step: fire-and-forget enqueue of both turn sides into the
 * vectorize queue. It depends on 'respond', and the step engine stops on any
 * earlier failure (`ctx.done = true` on step errors) — so memory only ever
 * sees successful turns, structurally, without a doneReason check.
 *
 * The enqueue itself is a fast queue add (~1ms): the heavy work (fact
 * extraction, embedding, upsert) happens in the vectorize worker, off the
 * request path. The enqueue service no-ops when the feature is disabled or
 * the turn has no session id; this step catches anything it throws so a
 * memory hiccup can never fail a turn that already responded.
 */
@Injectable()
export class VectorizeStepService implements StepHandler {
  private readonly logger = new Logger(VectorizeStepService.name);

  constructor(private readonly memoryEnqueueService: MemoryEnqueueService) {}

  async execute(ctx: HarnessContext): Promise<void> {
    try {
      await this.memoryEnqueueService.enqueueTurn({
        memoryPartition: ctx.memoryPartition,
        sessionId: ctx.sessionId,
        conversationId: ctx.filters.conversationId,
        requestId: ctx.requestId,
        model: ctx.model,
        numCtx: ctx.request.options?.num_ctx,
        files: ctx.files,
        userText: ctx.lastUserPrompt,
        // Feed the extractor the response's prose, not its raw JSON —
        // structured templates (article/news/product) once surfaced JSON keys
        // and URL fragments as memory "facts". Reasoning markup (a model
        // inlining <think>…</think> into content) is stripped — the
        // zero-facts fallback stores this text verbatim.
        assistantText: stripThinking(
          buildResponseExtractionText({
            content: ctx.outputs.finalContent,
            data: ctx.outputs.finalData,
          }),
        ),
      });
      this.logger.log(
        { requestId: ctx.requestId, step: 'vectorize' },
        'memory write enqueued',
      );
    } catch (error) {
      this.logger.error(
        {
          requestId: ctx.requestId,
          step: 'vectorize',
          err: error instanceof Error ? error : new Error(String(error)),
        },
        `memory write enqueue failed for ${ctx.requestId}`,
      );
    }
  }
}
