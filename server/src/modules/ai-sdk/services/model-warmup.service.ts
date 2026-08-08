import { Injectable, Logger } from '@nestjs/common';

import { OllamaConfigService } from '../configs/ollama-config.service.js';
import { buildOllamaHeaders } from '../helpers/build-ollama-headers.helper.js';

import { OllamaOverridesService } from './ollama-overrides.service.js';

/**
 * How long a warm-up is considered fresh. Matches the default keepAlive
 * window (5m) so a model is not re-warmed on every selection while it is
 * still resident in Ollama.
 */
const WARM_DEDUPE_TTL_MS = 5 * 60_000;

/**
 * Pre-loads a model's weights in Ollama so the first real prompt does not
 * stall on a cold load. Fire-and-forget: the caller never waits on the
 * warm call, and a failure is logged, never surfaced. Cloud models are
 * served remotely and are skipped by the client before this is called.
 */
@Injectable()
export class ModelWarmupService {
  private readonly logger = new Logger(ModelWarmupService.name);
  private readonly lastWarmAt = new Map<string, number>();

  constructor(
    private readonly ollamaConfig: OllamaConfigService,
    private readonly ollamaOverrides: OllamaOverridesService,
  ) {}

  /**
   * Warm a model unless it was warmed within the dedupe window. Returns
   * immediately; the generate call runs in the background.
   */
  warm(model: string): void {
    const trimmed = model.trim();
    if (!trimmed) return;

    const now = Date.now();
    const last = this.lastWarmAt.get(trimmed);
    if (last !== undefined && now - last < WARM_DEDUPE_TTL_MS) return;
    this.lastWarmAt.set(trimmed, now);

    void this.performWarm(trimmed);
  }

  private async performWarm(model: string): Promise<void> {
    const { host, apiKey } = this.ollamaOverrides.getConfig();
    const keepAlive = this.ollamaConfig.config.keepAlive;
    const url = host.startsWith('http')
      ? `${host}/generate`
      : `http://${host}/api/generate`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildOllamaHeaders(apiKey),
        },
        body: JSON.stringify({ model, prompt: '', keep_alive: keepAlive }),
        cache: 'no-store',
      });
      if (!res.ok) {
        this.logger.warn(`Model warm-up failed for "${model}" (${res.status})`);
      }
    } catch (error) {
      this.logger.warn(
        `Model warm-up failed for "${model}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
