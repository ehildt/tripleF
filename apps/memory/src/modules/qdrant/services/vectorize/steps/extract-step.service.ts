import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  buildExtractionCorrectionPrompt,
  buildExtractionPrompt,
} from '@triplef/agent/prompts';
import { AiSdkService } from '@triplef/ai-sdk';
import { limitText } from '@triplef/helpers/limit-text';

import { buildProviderOptions } from '../../../../ai-sdk/helpers/provider-options.helper.js';
import { QDRANT_CONFIG } from '../../../constants/qdrant.constants.js';
import { buildPriorMemorySection } from '../../../helpers/build-prior-memory-section.helper.js';
import { derivePayloadChars } from '../../../helpers/derive-payload-chars.helper.js';
import { parseExtraction } from '../../../helpers/parse-extraction.helper.js';
import type { QdrantConfig } from '../../../models/qdrant-config.model.js';
import { MemoryRepository } from '../../memory.repository.js';
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
    private readonly memoryRepository: MemoryRepository,
    @Inject(QDRANT_CONFIG) private readonly qdrantConfig: QdrantConfig,
  ) {}

  async execute(ctx: VectorizeContext): Promise<void> {
    if (!ctx.model) {
      ctx.outputs.extraction = { facts: [], tags: [] };
      return;
    }

    const sourceText = limitText(
      ctx.text,
      derivePayloadChars(
        ctx.numCtx,
        this.qdrantConfig.vectorizeTextRatio,
        this.qdrantConfig.vectorizeTextChars,
      ),
    );

    const priorSection = buildPriorMemorySection(
      await this.memorySearch.searchByText({
        memoryPartition: ctx.memoryPartition,
        text: sourceText,
        limit: 6,
      }),
    );

    // The partition's existing category/tag vocabulary — a reuse-first hint
    // so the model extends the taxonomy instead of minting near-duplicates.
    const [categories, knownTags] = await Promise.all([
      this.memoryRepository.facetCategories(ctx.memoryPartition),
      this.memoryRepository.facetTags(ctx.memoryPartition),
    ]);

    const messages = [
      {
        role: 'system' as const,
        content: buildExtractionPrompt(
          categories.map((entry) => entry.value),
          knownTags.map((entry) => entry.value),
        ),
      },
      {
        role: 'user' as const,
        content: sourceText + (priorSection ? `\n\n${priorSection}` : ''),
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
      const text = await this.fetchExtractionText(ctx, messages);
      if (text === null) return { facts: [], tags: [] };

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

  /**
   * One chat call for the extraction. A failed LLM call (model down / network)
   * degrades to null — infrastructure failures are the queue's retry domain,
   * and the turn is still stored text-only by later steps.
   */
  private async fetchExtractionText(
    ctx: VectorizeContext,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<string | null> {
    try {
      const { text } = await this.aiSdkService.generateChat({
        model: ctx.model!,
        messages: messages as never,
        providerOptions: buildProviderOptions({
          think: false,
        }),
        tools: {},
      });
      return text;
    } catch (error) {
      this.logger.warn(
        {
          jobId: ctx.jobId,
          requestId: ctx.requestId,
          step: 'extract',
          err: error instanceof Error ? error : new Error(String(error)),
        },
        `extraction call failed for job ${ctx.jobId}`,
      );
      return null;
    }
  }
}
