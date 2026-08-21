import { Inject, Injectable } from '@nestjs/common';

import { QDRANT_CONFIG } from '../../../qdrant/constants/qdrant.constants.js';
import type { QdrantConfig } from '../../../qdrant/models/qdrant-config.model.js';
import { MemoryEnqueueService } from '../../../qdrant/services/memory-enqueue.service.js';
import type { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';
import { HarnessStepLogger } from '../harness-step-logger.service.js';

const GATHERED_DATA_LIMIT = 3000;
const GATHERED_RESULT_LIMIT = 500;

/**
 * The memory write step — enqueue-only: when the classifier included
 * `memoryRemember` for the turn (the intent is authoritative) and the memory
 * feature is enabled with a partition in scope, the turn's summarized tool
 * results are enqueued as a memory-write job. The actual write (prior-memory
 * search, LLM tool loop, storage) runs in the vectorize worker — off the
 * harness hot path, with BullMQ retries instead of in-turn catch-and-log.
 * Enqueue errors are logged, never thrown.
 */
@Injectable()
export class MemoryWriteStepService implements StepHandler {
  constructor(
    private readonly memoryEnqueue: MemoryEnqueueService,
    private readonly stepLogger: HarnessStepLogger,
    @Inject(QDRANT_CONFIG) private readonly qdrantConfig: QdrantConfig,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    const wantsWrite = (ctx.outputs.intent?.tools ?? []).includes(
      'memoryRemember',
    );
    const memoryPartition = ctx.memoryPartition ?? ctx.sessionId;
    if (!wantsWrite || !this.qdrantConfig.enabled || !memoryPartition) {
      this.stepLogger.log(
        ctx,
        'memory-write',
        'skipped: no memory-write intent',
      );
      return;
    }

    const gathered = ctx.outputs.toolResults
      .filter(
        (r) => r.toolName !== 'memoryRecall' && r.toolName !== 'memoryRemember',
      )
      .map(
        (r) =>
          `[${r.toolName}] ${summarizeResult(r.result, GATHERED_RESULT_LIMIT)}`,
      )
      .join('\n')
      .slice(0, GATHERED_DATA_LIMIT)
      .trim();

    await this.memoryEnqueue.enqueueWriteJob({
      memoryPartition,
      sessionId: ctx.sessionId,
      conversationId: ctx.filters?.conversationId,
      requestId: ctx.requestId,
      userRequest: ctx.lastUserPrompt ?? '',
      gathered: gathered || undefined,
      model: ctx.model,
      think: ctx.request.think,
      numCtx: ctx.request.options?.num_ctx,
    });
    this.stepLogger.log(ctx, 'memory-write', 'enqueued');
  }
}

/** Render a tool result as a single readable line for the write-job prompt. */
function summarizeResult(result: unknown, limit: number): string {
  const text =
    typeof result === 'string' ? result : JSON.stringify(result ?? '');
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}
