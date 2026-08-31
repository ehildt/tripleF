import { Injectable, Logger } from '@nestjs/common';

import { EmbeddingService } from '../../embedding.service.js';
import type { VectorizeContext } from '../vectorize-context.type.js';
import type { VectorizeStepHandler } from '../vectorize-step.interface.js';

/**
 * 'embed' — one batch embed of the extracted facts. An out-of-spec vector
 * count mismatch throws — the queue retries instead of silently storing a
 * half-turn.
 */
@Injectable()
export class EmbedStepService implements VectorizeStepHandler {
  private readonly logger = new Logger(EmbedStepService.name);

  constructor(private readonly embeddingService: EmbeddingService) {}

  async execute(ctx: VectorizeContext): Promise<void> {
    const facts = ctx.outputs.extraction?.facts ?? [];
    if (facts.length === 0) {
      ctx.outputs.vectors = [];
      this.logger.log(
        { jobId: ctx.jobId, requestId: ctx.requestId, step: 'embed' },
        'no facts to embed',
      );
      return;
    }

    const vectors = await this.embeddingService.embed(
      facts.map((fact) => fact.text),
      'document',
    );
    if (vectors.length !== facts.length) {
      // An out-of-spec Ollama response — throw so the queue retries instead
      // of silently storing nothing for this turn.
      throw new Error(
        `Ollama embed returned ${vectors.length} vectors for ${facts.length} inputs`,
      );
    }
    ctx.outputs.vectors = vectors;
    this.logger.log(
      {
        jobId: ctx.jobId,
        requestId: ctx.requestId,
        step: 'embed',
        facts,
        count: facts.length,
      },
      `embedded ${vectors.length} facts`,
    );
  }
}
