import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createOllama } from 'ollama-ai-provider-v2';

import { buildOllamaHeaders } from './helpers/build-ollama-headers.helper.ts';
import { isOllamaCloudHost } from './helpers/is-ollama-cloud-host.helper.ts';
import { mapModelCatalogEntry } from './helpers/map-model-catalog-entry.helper.ts';
import { mapRawTag } from './helpers/map-raw-tag.helper.ts';
import { mapTaggedModelOrigin } from './helpers/map-tagged-model-origin.helper.ts';
import {
  CLOUD_RETRY_DELAYS_MS,
  DEFAULT_MODELS_CACHE_TTL_MS,
  DEFAULT_SHOW_CACHE_TTL_MS,
  OLLAMA_API_CONFIG,
  OLLAMA_CLOUD_HOST,
} from './ollama-api.constants.ts';
import type {
  ModelOrigin,
  OllamaApiConfig,
  OllamaModelsCatalog,
  OllamaProvider,
  ShowResult,
  TaggedModel,
} from './ollama-api.model.ts';

/**
 * Lean Ollama API client: the merged local + Ollama Cloud model catalog,
 * per-model origin/capability resolution, and a cached provider-client
 * factory for `@triplef/ai-sdk`. The effective connection is resolved per
 * call through the app-supplied `resolveConnection`, so live overrides (new
 * host, new API key) take effect on the very next request.
 */
@Injectable()
export class OllamaApiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OllamaApiService.name);
  private refreshTimer?: NodeJS.Timeout;
  private modelsCache?: { data: OllamaModelsCatalog; expires: number };
  private showCache = new Map<string, { data: ShowResult; expires: number }>();
  private originByModel = new Map<string, ModelOrigin>();
  private clients = new Map<string, OllamaProvider>();

  constructor(@Inject(OLLAMA_API_CONFIG) private readonly config: OllamaApiConfig) {}

  /**
   * Prime the model-origin catalog at boot and keep it fresh. Without a
   * warm origin map, getModelOrigin falls back to 'local' for cloud models,
   * which would route them at the (wrong) local Ollama host. Consumers with
   * an endpoint that warms the catalog lazily omit `refreshIntervalMs`.
   */
  onModuleInit(): void {
    if (!this.config.refreshIntervalMs) return;
    this.refreshTimer = setInterval(() => void this.getModels(), this.config.refreshIntervalMs);
    this.refreshTimer.unref();
    void this.getModels();
  }

  onModuleDestroy(): void {
    clearInterval(this.refreshTimer);
  }

  /**
   * Where a model runs — resolved from the last fetched catalog. Unknown
   * models default to 'local' (the pre-cloud behavior).
   */
  getModelOrigin(modelName: string): ModelOrigin {
    return this.originByModel.get(modelName) ?? 'local';
  }

  async supportsCapability(modelName: string, capability: string): Promise<boolean> {
    const show = await this.getModelShow(modelName);
    const capabilities = show?.capabilities ?? [];
    if (capabilities.includes(capability)) return true;
    // Fallback: older Ollama (pre-0.5.x) and some models/quantizations don't
    // populate `capabilities` — detect vision from the model_info keys that
    // Ollama itself uses to derive the capability (PR #10066).
    if (capability === 'vision') return detectVision(show?.model_info);
    return false;
  }

  /**
   * The merged model catalog: models from the configured host ('local')
   * plus, when an API key is set, the models available directly on
   * Ollama Cloud ('cloud'). When the configured host already is Ollama
   * Cloud, every model is cloud — no second catalog is fetched.
   */
  async getModels(): Promise<OllamaModelsCatalog> {
    if (this.modelsCache && this.modelsCache.expires > Date.now()) return this.modelsCache.data;

    const { host, apiKey } = this.config.resolveConnection();
    const hostIsCloud = isOllamaCloudHost(host);

    const tagged: TaggedModel[] = (await this.fetchTags(host, apiKey)).map((model) =>
      mapTaggedModelOrigin(model, hostIsCloud),
    );

    if (!hostIsCloud && apiKey) {
      try {
        const seen = new Set(tagged.map((m) => m.name));
        const cloudModels = await this.fetchCloudTags(apiKey);
        for (const model of cloudModels) {
          if (seen.has(model.name)) continue;
          tagged.push({ ...model, origin: 'cloud' });
        }
      } catch (error) {
        this.logger.warn(`Ollama Cloud catalog unavailable: ${error instanceof Error ? error.message : error}`);
      }
    }

    const models = await Promise.all(
      tagged.map(async (entry) => {
        const show = await this.getModelShow(entry.name, entry.origin);
        return mapModelCatalogEntry(entry, show, this.extractContextLength(show?.model_info));
      }),
    );

    this.originByModel = new Map(models.map((m) => [m.model, m.origin]));
    const data = { models };
    this.modelsCache = {
      data,
      expires: Date.now() + (this.config.modelsCacheTtlMs ?? DEFAULT_MODELS_CACHE_TTL_MS),
    };
    return data;
  }

  /**
   * Resolve a model name to an `ollama-ai-provider-v2` model, routing it to
   * its local or cloud host. One provider client is cached per host/API-key
   * pair, so connection overrides pick up a fresh client automatically.
   */
  createModel(name: string): ReturnType<OllamaProvider> {
    const { host, apiKey } = this.config.resolveConnection();
    const baseURL = this.getModelOrigin(name) === 'cloud' ? OLLAMA_CLOUD_HOST : host;
    const fingerprint = `${baseURL}|${apiKey ?? ''}`;
    let client = this.clients.get(fingerprint);
    if (!client) {
      client = createOllama({
        baseURL,
        headers: buildOllamaHeaders(apiKey),
      });
      this.clients.set(fingerprint, client);
    }
    return client(name);
  }

  /**
   * The Ollama Cloud catalog fetch with retries: the call often fails once
   * right after a server boot (network path to ollama.com still warming
   * up), which would surface a local-only catalog and force the user into
   * a second lookup. Three attempts with short backoff cover the cold
   * start; a final failure still surfaces the local catalog alone.
   */
  private async fetchCloudTags(apiKey: string): Promise<Array<Pick<TaggedModel, 'name' | 'details'>>> {
    let lastError: unknown;
    for (const delay of CLOUD_RETRY_DELAYS_MS) {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      try {
        return await this.fetchTags(OLLAMA_CLOUD_HOST, apiKey);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  private async fetchTags(host: string, apiKey?: string): Promise<Array<Pick<TaggedModel, 'name' | 'details'>>> {
    const tagsUrl = host.startsWith('http') ? `${host}/tags` : `http://${host}/api/tags`;

    const tagsRes = await fetch(tagsUrl, {
      headers: buildOllamaHeaders(apiKey),
    });

    if (!tagsRes.ok) throw new Error(`Ollama API error: ${tagsRes.status}`);
    const tags = await tagsRes.json();

    return (tags.models ?? []).map(mapRawTag);
  }

  private async getModelShow(name: string, origin?: ModelOrigin): Promise<ShowResult | null> {
    const cached = this.showCache.get(name);
    if (cached && cached.expires > Date.now()) return cached.data;

    const resolvedOrigin = origin ?? this.getModelOrigin(name);
    const { host, apiKey } = this.config.resolveConnection();
    const showHost = resolvedOrigin === 'cloud' ? OLLAMA_CLOUD_HOST : host;
    const url = showHost.startsWith('http') ? `${showHost}/show` : `http://${showHost}/api/show`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildOllamaHeaders(apiKey),
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as ShowResult;
      this.showCache.set(name, {
        data,
        expires: Date.now() + (this.config.showCacheTtlMs ?? DEFAULT_SHOW_CACHE_TTL_MS),
      });
      return data;
    } catch {
      return null;
    }
  }

  private extractContextLength(model_info?: Record<string, unknown>): number | undefined {
    if (!model_info) return undefined;
    const key = Object.keys(model_info).find((k) => k.endsWith('.context_length'));
    if (!key) return undefined;
    const val = model_info[key];
    return typeof val === 'number' ? val : Number(val) || undefined;
  }
}

/**
 * Vision fallback for models whose `/api/show` response omits `capabilities`
 * (older Ollama, or models that don't populate it). Ollama derives the
 * `vision` capability from a `vision.block_count` KV (PR #10066); projector
 * and CLIP keys are the same signal under different naming.
 */
function detectVision(modelInfo?: Record<string, unknown>): boolean {
  if (!modelInfo) return false;
  return Object.keys(modelInfo).some(
    (key) =>
      key === 'vision.block_count' ||
      key.endsWith('.vision.block_count') ||
      key.includes('.vision.') ||
      key.includes('projector') ||
      key.startsWith('clip.'),
  );
}
