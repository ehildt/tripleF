import { Inject, Injectable, Logger } from '@nestjs/common';
import { limitText } from '@triplef/helpers/limit-text';

import type { MemoryClientConfig } from '../../../memory-client/configs/memory-client-config.adapter.js';
import { MEMORY_CLIENT_CONFIG } from '../../../memory-client/constants/memory-client.constants.js';
import { MemoryEnqueueService } from '../../../memory-client/services/memory-enqueue.service.js';
import { deriveGatheredChars } from '../../configs/source-budget-config.adapter.js';
import { SourceBudgetConfigService } from '../../configs/source-budget-config.service.js';
import { stripThinking } from '../../helpers/extraction/strip-thinking.helper.js';
import type { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

/**
 * The memory write step — enqueue-only: when the classifier included either
 * remember tool (`memory-partition-remember` or `memory-cognition-remember`)
 * for the turn (the intent is authoritative) and the memory feature is
 * enabled with a partition in scope, the turn's summarized tool results are
 * enqueued as a memory-write job. The actual write (prior-memory search, LLM
 * tool loop, storage) runs in the vectorize worker — off the harness hot
 * path, with BullMQ retries instead of in-turn catch-and-log. Enqueue errors
 * are logged, never thrown.
 */
@Injectable()
export class MemoryWriteStepService implements StepHandler {
  private readonly logger = new Logger(MemoryWriteStepService.name);

  constructor(
    private readonly memoryEnqueue: MemoryEnqueueService,
    @Inject(MEMORY_CLIENT_CONFIG)
    private readonly memoryConfig: MemoryClientConfig,
    private readonly sourceBudget: SourceBudgetConfigService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    const intentTools = ctx.outputs.intent?.tools ?? [];
    const wantsWrite =
      intentTools.includes('memory-partition-remember') ||
      intentTools.includes('memory-cognition-remember');
    const memoryPartition = ctx.memoryPartition ?? ctx.sessionId;
    if (!wantsWrite || !this.memoryConfig.enabled || !memoryPartition) {
      this.logger.log(
        { requestId: ctx.requestId, step: 'memory-write' },
        'skipped: no memory-write intent',
      );
      return;
    }

    const gatheredChars = deriveGatheredChars(
      ctx.request.options?.num_ctx,
      this.sourceBudget.config,
    );
    const resultChars = Math.trunc(gatheredChars / 8);

    // Tool output can carry scraped content with thinking markup inside —
    // the write job may store this text verbatim on its zero-facts fallback.
    const gathered =
      stripThinking(
        limitText(
          ctx.outputs.toolResults
            .filter(
              (r) =>
                r.toolName !== 'memory-partition-recall' &&
                r.toolName !== 'memory-partition-remember' &&
                r.toolName !== 'memory-cognition-remember',
            )
            .map(
              (r) =>
                `[${r.toolName}] ${limitText(stringifyResult(r.result), resultChars)}`,
            )
            .join('\n'),
          gatheredChars,
        ).trim(),
      ) ?? '';

    // What the probe already surfaced this turn — passed separately from
    // `gathered` so the write job can treat it as ALREADY KNOWN (extend or
    // update, never re-store) rather than as newly gathered data.
    const probedMemory = limitText(
      ctx.outputs.toolResults
        .filter((r) => r.toolName === 'memory-partition-recall')
        .map((r) => stringifyResult(r.result))
        .join('\n'),
      gatheredChars,
    ).trim();

    await this.memoryEnqueue.enqueueWriteJob({
      memoryPartition,
      memoryCognition:
        ctx.memoryCognition ?? ctx.memoryPartition ?? ctx.sessionId,
      sessionId: ctx.sessionId,
      conversationId: ctx.filters?.conversationId,
      requestId: ctx.requestId,
      userRequest: ctx.lastUserPrompt ?? '',
      gathered: gathered || undefined,
      probedMemory: probedMemory || undefined,
      model: ctx.model,
      think: ctx.request.think,
      numCtx: ctx.request.options?.num_ctx,
    });
    this.logger.log(
      { requestId: ctx.requestId, step: 'memory-write' },
      'enqueued',
    );
  }
}

/** Render a tool result as a single readable line for the write-job prompt. */
function stringifyResult(result: unknown): string {
  return typeof result === 'string' ? result : JSON.stringify(result ?? '');
}
