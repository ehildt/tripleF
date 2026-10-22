import { Injectable, Logger } from '@nestjs/common';
import { MEMORY_TOOL_NAMES } from '@triplef/agent/schemas';
import { limitText } from '@triplef/helpers/limit-text';

import { MemoryEnqueueService } from '../../../memory-client/services/memory-enqueue.service.js';
import { deriveGatheredChars } from '../../configs/source-budget-config.adapter.js';
import { SourceBudgetConfigService } from '../../configs/source-budget-config.service.js';
import { buildResponseExtractionText } from '../../helpers/extraction/build-response-extraction-text.helper.js';
import { stripThinking } from '../../helpers/extraction/strip-thinking.helper.js';
import type { HarnessContext } from '../harness-context.type.js';
import { StepHandler } from '../harness-step.interface.js';

import { stringifyToolResult } from './helpers/stringify-tool-result.helper.js';

/** Tool names whose results never count as gathered data (memory reads/writes about memory, not content). */
const MEMORY_RESULT_TOOLS = new Set<string>(MEMORY_TOOL_NAMES);

/**
 * The memory write step: fire-and-forget enqueue of the turn into the
 * vectorize queue — one judged job per turn-side. It depends on 'respond',
 * and the step engine stops on any earlier failure (`ctx.done = true` on
 * step errors) — so memory only ever sees successful turns, structurally,
 * without a doneReason check.
 *
 * Judged records only: the worker's extraction step decides with a
 * schema-enforced verdict whether anything in the turn is worth storing
 * (`remember: false` stores nothing) — there is no blind always-store path
 * and no classifier gate. To judge with full context, the payload carries
 * the turn's summarized non-memory tool results (gathered data) and the
 * attached file names alongside the turn-side text.
 *
 * The assistant side is only enqueued when the turn actually gathered
 * external data or the user attached files: a pure-chat answer is the
 * model's parametric voice — nothing user-specific to file.
 *
 * The enqueue itself is a fast queue add (~1ms): the heavy work (the
 * extraction judgment, embedding, upsert) happens in the vectorize worker,
 * off the request path. The enqueue service no-ops when the feature is
 * disabled or the turn has no session id; this step catches anything it
 * throws so a memory hiccup can never fail a turn that already responded.
 */
@Injectable()
export class VectorizeStepService implements StepHandler {
  private readonly logger = new Logger(VectorizeStepService.name);

  constructor(
    private readonly memoryEnqueueService: MemoryEnqueueService,
    private readonly sourceBudget: SourceBudgetConfigService,
  ) {}

  async execute(ctx: HarnessContext): Promise<void> {
    try {
      const gathered = this.buildGathered(ctx);
      const hasFiles = (ctx.files?.length ?? 0) > 0;
      // Assistant-side gate: no gathered data and no attachments means the
      // answer was pure parametric chat — model voice, not memory material.
      const assistantText =
        gathered || hasFiles
          ? stripThinking(
              buildResponseExtractionText({
                content: ctx.outputs.finalContent,
                data: ctx.outputs.finalData,
              }),
              // Feed the extractor the response's prose, not its raw JSON —
              // structured templates (article/news/product) once surfaced JSON
              // keys and URL fragments as memory "facts". Reasoning markup (a
              // model inlining <think>…</think> into content) is stripped.
            )
          : undefined;
      await this.memoryEnqueueService.enqueueTurn({
        memoryPartition: ctx.memoryPartition,
        sessionId: ctx.sessionId,
        conversationId: ctx.filters.conversationId,
        requestId: ctx.requestId,
        model: ctx.model,
        numCtx: ctx.request.options?.num_ctx,
        files: ctx.files,
        gathered,
        userText: ctx.lastUserPrompt,
        assistantText,
      });
      this.logger.log(
        {
          requestId: ctx.requestId,
          step: 'vectorize',
          assistantSide: assistantText !== undefined,
        },
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

  /**
   * The turn's non-memory tool results, summarized and capped by the source
   * budget — the extraction judgment's gathered-data context. Thinking
   * markup inside scraped content is stripped; memory-tool results (recall
   * hits, delete confirmations) never count — they are memory reads, not
   * gathered content.
   */
  private buildGathered(ctx: HarnessContext): string | undefined {
    const gatheredChars = deriveGatheredChars(
      ctx.request.options?.num_ctx,
      this.sourceBudget.config,
    );
    const resultChars = Math.trunc(gatheredChars / 8);
    const gathered =
      stripThinking(
        limitText(
          (ctx.outputs.toolResults ?? [])
            .filter((r) => !MEMORY_RESULT_TOOLS.has(r.toolName))
            .map(
              (r) =>
                `[${r.toolName}] ${limitText(stringifyToolResult(r.result), resultChars)}`,
            )
            .join('\n'),
          gatheredChars,
        ).trim(),
      ) ?? '';
    return gathered || undefined;
  }
}
