import { Inject, Injectable } from '@nestjs/common';
import { buildOllamaHeaders } from '@triplef/ollama-api';

import { OllamaConfigService } from '../../ollama/configs/ollama-config.service.js';
import { OllamaOverridesService } from '../../ollama/services/ollama-overrides.service.js';
import { QDRANT_CONFIG } from '../constants/qdrant.constants.js';
import { applyEmbeddingRole } from '../helpers/embedding-prompt.helper.js';
import { EmbeddingFailureError } from '../helpers/vectorize-failure.helper.js';
import type { EmbeddingRole } from '../models/embedding.model.js';
import type { QdrantConfig } from '../models/qdrant-config.model.js';

/**
 * Ollama `/api/embed` client for the vectorize pipeline. Accepts a string or
 * an array of strings and returns one L2-normalized vector per input — the
 * batch shape that lets a whole turn-side (all TextToLines chunks) embed in
 * a single round-trip.
 *
 * Every input is prefixed with the configured model's documented task prefix
 * for the given role (query vs document) before sending — instruction-tuned
 * embedders are trained on prefixed input and retrieve worse without it.
 *
 * Connection settings resolve through the same overrides plumbing as the
 * harness LLM calls, so a Settings host/API-key override applies here too.
 */
@Injectable()
export class EmbeddingService {
  constructor(
    private readonly ollamaOverrides: OllamaOverridesService,
    private readonly ollamaConfig: OllamaConfigService,
    @Inject(QDRANT_CONFIG) private readonly config: QdrantConfig,
  ) {}

  async embed(
    input: string | string[],
    role: EmbeddingRole,
  ): Promise<number[][]> {
    const { host, apiKey } = this.ollamaOverrides.getConfig();
    const prefixed = Array.isArray(input)
      ? input.map((text) =>
          applyEmbeddingRole(this.config.embedModel, role, text),
        )
      : applyEmbeddingRole(this.config.embedModel, role, input);
    const response = await fetch(`${host}/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildOllamaHeaders(apiKey),
      },
      // A hung Ollama must not stall a vectorize job until stalled-recovery
      // re-runs it — the timeout surfaces as a transient failure and retries.
      signal: AbortSignal.timeout(this.config.embedTimeoutMs),
      body: JSON.stringify({
        model: this.config.embedModel,
        input: prefixed,
        keep_alive: this.ollamaConfig.config.keepAlive,
      }),
    });
    if (!response.ok) {
      throw new EmbeddingFailureError(
        response.status,
        `Ollama embed failed (${response.status})`,
      );
    }
    const data = (await response.json()) as { embeddings: number[][] };
    return data.embeddings;
  }

  /**
   * One-vector probe used at bootstrap to learn the configured model's real
   * dimensionality, so the collection is created with the model's dims — never
   * a hardcoded guess. Throws when the model is unavailable; the caller falls
   * back to the configured size.
   */
  async embedDimension(): Promise<number> {
    const [vector] = await this.embed(['probe'], 'document');
    if (!vector?.length) {
      throw new Error('Embedding probe returned an empty vector');
    }
    return vector.length;
  }

  /**
   * True when the configured embedding model is pulled on the Ollama host.
   * Probed by the status endpoint and the health indicator so a missing model
   * (the most common memory failure) is visible instead of silently degrading.
   */
  async isModelReady(): Promise<boolean> {
    try {
      const { host, apiKey } = this.ollamaOverrides.getConfig();
      const response = await fetch(`${host}/tags`, {
        headers: buildOllamaHeaders(apiKey),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) return false;
      const data = (await response.json()) as {
        models?: Array<{ name?: string }>;
      };
      const names = (data.models ?? []).map((model) => model.name ?? '');
      return names.some(
        (name) =>
          name === this.config.embedModel ||
          name.startsWith(`${this.config.embedModel}:`),
      );
    } catch {
      return false;
    }
  }
}
