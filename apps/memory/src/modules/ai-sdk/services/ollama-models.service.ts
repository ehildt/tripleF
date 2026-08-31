import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { CacheReturnValue } from '@triplef/config-factory/cache-return-value';

import {
  CLOUD_RETRY_DELAYS_MS,
  MODELS_CACHE_TTL_MS,
  MODELS_REFRESH_INTERVAL_MS,
  OLLAMA_CLOUD_HOST,
} from '../constants/ollama-cloud.constants.js';
import { buildOllamaHeaders } from '../helpers/build-ollama-headers.helper.js';
import { isOllamaCloudHost } from '../helpers/is-ollama-cloud-host.helper.js';

import { mapModelCatalogEntry } from './helpers/map-model-catalog-entry.helper.js';
import { mapRawTag } from './helpers/map-raw-tag.helper.js';
import { mapTaggedModelOrigin } from './helpers/map-tagged-model-origin.helper.js';
import type {
  ModelOrigin,
  ShowResult,
  TaggedModel,
} from './ollama-models.service.types.js';
import { OllamaOverridesService } from './ollama-overrides.service.js';

@Injectable()
export class OllamaModelsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OllamaModelsService.name);
  private showCache = new Map<string, { data: ShowResult; expires: number }>();
  private originByModel = new Map<string, ModelOrigin>();
  private refreshTimer?: NodeJS.Timeout;

  constructor(private readonly ollamaOverrides: OllamaOverridesService) {}

  /**
   * Prime the model-origin catalog at boot and keep it fresh. Without a
   * warm origin map, getModelOrigin falls back to 'local' for cloud models,
   * which would route them at the (wrong) local Ollama host — the server
   * warms this cache lazily via its models endpoint; the memory app has no
   * such endpoint, so it must warm itself.
   */
  onModuleInit(): void {
    this.refreshTimer = setInterval(
      () => void this.getModels(),
      MODELS_REFRESH_INTERVAL_MS,
    );
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

  async supportsCapability(
    modelName: string,
    capability: string,
  ): Promise<boolean> {
    const show = await this.getModelShow(modelName);
    const capabilities = show?.capabilities ?? [];
    return capabilities.includes(capability);
  }

  /**
   * The merged model catalog: models from the configured host ('local')
   * plus, when an API key is set, the models available directly on
   * Ollama Cloud ('cloud'). When the configured host already is Ollama
   * Cloud, every model is cloud — no second catalog is fetched.
   */
  @CacheReturnValue({ ttl: MODELS_CACHE_TTL_MS })
  async getModels() {
    const { host, apiKey } = this.ollamaOverrides.getConfig();
    const hostIsCloud = isOllamaCloudHost(host);

    const tagged: TaggedModel[] = (await this.fetchTags(host, apiKey)).map(
      (model) => mapTaggedModelOrigin(model, hostIsCloud),
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
        this.logger.warn(
          `Ollama Cloud catalog unavailable: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    const models = await Promise.all(
      tagged.map(async (entry) => {
        const show = await this.getModelShow(entry.name, entry.origin);
        return mapModelCatalogEntry(
          entry,
          show,
          this.extractContextLength(show?.model_info),
        );
      }),
    );

    this.originByModel = new Map(models.map((m) => [m.model, m.origin]));
    return { models };
  }

  /**
   * The Ollama Cloud catalog fetch with retries: the call often fails once
   * right after a server boot (network path to ollama.com still warming
   * up), which would surface a local-only catalog and force the user into
   * a second lookup. Three attempts with short backoff cover the cold
   * start; a final failure still surfaces the local catalog alone.
   */
  private async fetchCloudTags(
    apiKey: string,
  ): Promise<Array<Pick<TaggedModel, 'name' | 'details'>>> {
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

  private async fetchTags(
    host: string,
    apiKey?: string,
  ): Promise<Array<Pick<TaggedModel, 'name' | 'details'>>> {
    const tagsUrl = host.startsWith('http')
      ? `${host}/tags`
      : `http://${host}/api/tags`;

    const tagsRes = await fetch(tagsUrl, {
      headers: buildOllamaHeaders(apiKey),
    });

    if (!tagsRes.ok) throw new Error(`Ollama API error: ${tagsRes.status}`);
    const tags = await tagsRes.json();

    return (tags.models ?? []).map(mapRawTag);
  }

  private async getModelShow(
    name: string,
    origin?: ModelOrigin,
  ): Promise<ShowResult | null> {
    const cached = this.showCache.get(name);
    if (cached && cached.expires > Date.now()) return cached.data;

    const resolvedOrigin = origin ?? this.getModelOrigin(name);
    const { host, apiKey } = this.ollamaOverrides.getConfig();
    const showHost = resolvedOrigin === 'cloud' ? OLLAMA_CLOUD_HOST : host;
    const url = showHost.startsWith('http')
      ? `${showHost}/show`
      : `http://${showHost}/api/show`;

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
      this.showCache.set(name, { data, expires: Date.now() + 300_000 });
      return data;
    } catch {
      return null;
    }
  }

  private extractContextLength(
    model_info?: Record<string, unknown>,
  ): number | undefined {
    if (!model_info) return undefined;
    const key = Object.keys(model_info).find((k) =>
      k.endsWith('.context_length'),
    );
    if (!key) return undefined;
    const val = model_info[key];
    return typeof val === 'number' ? val : Number(val) || undefined;
  }
}
