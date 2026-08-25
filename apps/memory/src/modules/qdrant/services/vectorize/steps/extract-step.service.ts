import { Injectable, Logger } from '@nestjs/common';

import { AiSdkService } from '../../../../ai-sdk/services/ai-sdk.service.js';
import {
  buildExtractionCorrectionPrompt,
  buildExtractionPrompt,
} from '../../../constants/vectorize-prompt.constant.js';
import { buildPriorMemorySection } from '../../../helpers/build-prior-memory-section.helper.js';
import { parseExtraction } from '../../../helpers/parse-extraction.helper.js';
import { MemorySearchService } from '../../memory-search.service.js';
import type { VectorizeContext } from '../vectorize-context.type.js';
import type { VectorizeStepHandler } from '../vectorize-step.interface.js';

/** One initial attempt + one correction pass — mirror of the interpret retry. */
const MAX_EXTRACTION_ATTEMPTS = 2;

/**
 * 'extract' — the LLM step of the vectorize pipeline: the chat model reads the
 * turn text, decides what is worth remembering (durable, self-contained facts),
 * and labels the topics (tags) for topic-filtered recall, under the structured
 * {facts, tags} template.
 *
 * Mirrors the harness LLM-step contract: template + structured prompt, tolerant
 * parse, one correction retry — then graceful degrade to an empty extraction.
 * The raw turn text is still stored by later steps, so memory degrades to
 * text-only, never to a failed job. No model on the job (manual ingestion)
 * skips extraction by design.
 *
 * Prior-memory-aware: before extraction the step probes the fact partition
 * with the raw turn text and appends the hits as an ALREADY STORED block, so
 * the model only emits genuinely new or refined facts (a probe miss degrades
 * to an unchanged prompt — searchByText never throws).
 */
@Injectable()
export class ExtractStepService implements VectorizeStepHandler {
  private readonly logger = new Logger(ExtractStepService.name);

  constructor(
    private readonly aiSdkService: AiSdkService,
    private readonly memorySearch: MemorySearchService,
  ) {}

  async execute(ctx: VectorizeContext): Promise<void> {
    if (!ctx.model) {
      ctx.outputs.extraction = { facts: [], tags: [] };
      return;
    }

    const priorSection = buildPriorMemorySection(
      await this.memorySearch.searchByText({
        memoryPartition: ctx.memoryPartition,
        text: ctx.text.slice(0, 8000),
        limit: 6,
      }),
    );

    const messages = [
      { role: 'system' as const, content: buildExtractionPrompt() },
      {
        role: 'user' as const,
        content:
          ctx.text.slice(0, 8000) + (priorSection ? `\n\n${priorSection}` : ''),
      },
    ];

    ctx.outputs.extraction = await this.runExtraction(ctx, messages);

    const { facts, tags } = ctx.outputs.extraction;
    this.logger.log(
      {
        jobId: ctx.jobId,
        requestId: ctx.requestId,
        step: 'extract',
        factCount: facts.length,
        tags,
        sourceChars: ctx.text.length,
      },
      `extracted ${facts.length} facts`,
    );
    this.logger.debug(
      {
        jobId: ctx.jobId,
        requestId: ctx.requestId,
        step: 'extract',
        text: ctx.text.slice(0, 8000),
      },
      'extraction source',
    );
  }

  private async runExtraction(
    ctx: VectorizeContext,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ) {
    for (let attempt = 1; attempt <= MAX_EXTRACTION_ATTEMPTS; attempt++) {
      let text: string;
      try {
        ({ text } = await this.aiSdkService.generateChat({
          model: ctx.model!,
          messages: messages as never,
          think: false,
          tools: {},
        }));
      } catch (error) {
        // LLM call failed (model down / network) — degrade, no correction pass:
        // infrastructure failures are the queue's retry domain, and the turn
        // is still stored text-only.
        this.logger.warn(
          {
            jobId: ctx.jobId,
            requestId: ctx.requestId,
            step: 'extract',
            err: error instanceof Error ? error : new Error(String(error)),
          },
          `extraction call failed for job ${ctx.jobId}`,
        );
        return { facts: [], tags: [] };
      }

      try {
        return parseExtraction(text);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt >= MAX_EXTRACTION_ATTEMPTS) {
          this.logger.warn(
            {
              jobId: ctx.jobId,
              requestId: ctx.requestId,
              step: 'extract',
              err: error instanceof Error ? error : new Error(message),
            },
            `extraction still invalid after correction — degrading to empty for job ${ctx.jobId}`,
          );
          return { facts: [], tags: [] };
        }
        // One correction pass: the model sees its failed output and the error.
        messages.push(
          { role: 'assistant', content: text },
          { role: 'user', content: buildExtractionCorrectionPrompt(message) },
        );
      }
    }
    return { facts: [], tags: [] };
  }
}
