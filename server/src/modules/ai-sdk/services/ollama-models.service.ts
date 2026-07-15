import { CacheReturnValue } from '@ehildt/nestjs-config-factory/cache-return-value';
import { Injectable, Logger } from '@nestjs/common';

import { OllamaConfigService } from '../configs/ollama-config.service.js';

interface ShowResult {
  capabilities?: string[];
  model_info?: Record<string, unknown>;
}

@Injectable()
export class OllamaModelsService {
  private readonly logger = new Logger(OllamaModelsService.name);
  private showCache = new Map<string, { data: ShowResult; expires: number }>();

  constructor(private readonly ollamaConfigService: OllamaConfigService) {}

  async supportsCapability(
    modelName: string,
    capability: string,
  ): Promise<boolean> {
    const show = await this.getModelShow(modelName);
    const capabilities = show?.capabilities ?? [];
    return capabilities.includes(capability);
  }

  @CacheReturnValue({ ttl: 1 })
  async getModels() {
    const host =
      this.ollamaConfigService.config.host ?? 'http://127.0.0.1:11434/api';

    const tagsUrl = host.startsWith('http')
      ? `${host}/tags`
      : `http://${host}/api/tags`;

    const tagsRes = await fetch(tagsUrl, {
      headers: this.ollamaConfigService.config.headers,
    });

    if (!tagsRes.ok) throw new Error(`Ollama API error: ${tagsRes.status}`);
    const tags = await tagsRes.json();

    const models = await Promise.all(
      (tags.models ?? []).map(async (m: Record<string, unknown>) => {
        const show = await this.getModelShow(m.model as string);
        return {
          model: m.model,
          parameter_size: (m.details as Record<string, unknown>)
            ?.parameter_size,
          quantization_level: (m.details as Record<string, unknown>)
            ?.quantization_level,
          family: (m.details as Record<string, unknown>)?.family,
          capabilities: show?.capabilities ?? [],
          context_length: this.extractContextLength(show?.model_info),
        };
      }),
    );

    return { models };
  }

  private async getModelShow(name: string): Promise<ShowResult | null> {
    const cached = this.showCache.get(name);
    if (cached && cached.expires > Date.now()) return cached.data;

    try {
      const host =
        this.ollamaConfigService.config.host ?? 'http://127.0.0.1:11434/api';
      const url = host.startsWith('http')
        ? `${host}/show`
        : `http://${host}/api/show`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.ollamaConfigService.config.headers,
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
