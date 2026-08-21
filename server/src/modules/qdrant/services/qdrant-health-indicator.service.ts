import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

import { EmbeddingService } from './embedding.service.js';
import { QdrantClientService } from './qdrant-client.service.js';

@Injectable()
export class QdrantHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly qdrantClientService: QdrantClientService,
    private readonly embeddingService: EmbeddingService,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  async check(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    try {
      await this.qdrantClientService.ping();
      // When the feature is enabled, the embedding model must also be pulled —
      // a missing model is the most common memory failure and silently
      // degrades every write/read otherwise.
      if (
        this.config.enabled &&
        !(await this.embeddingService.isModelReady())
      ) {
        return indicator.down({
          message: `Embedding model "${this.config.embedModel}" not pulled on Ollama`,
        });
      }
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: String(error) });
    }
  }
}
