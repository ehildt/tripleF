import { Injectable } from '@nestjs/common';

import type { SerperConfig } from '../configs/serper-config.adapter.js';
import { SerperConfigService } from '../configs/serper-config.service.js';
import { isMaskedApiKey, maskApiKey } from '../helpers/mask-api-key.helper.js';

export interface ProviderOverridesSnapshot {
  serper: SerperConfig;
}

@Injectable()
export class ProviderOverridesService {
  private snapshot: ProviderOverridesSnapshot;
  private overrides: Record<string, any> = {};

  constructor(private readonly serperCfg: SerperConfigService) {
    this.snapshot = {
      serper: this.serperCfg.config,
    };
  }

  /**
   * The effective config with overrides applied, including the real API key.
   * For internal consumers only (tools, intent classification) — never
   * expose this to clients.
   */
  getConfig(): ProviderOverridesSnapshot {
    return this.applyOverrides(this.snapshot);
  }

  /**
   * The effective config with the API key masked (abcd********wxyz).
   * This is the only config form that may leave the server.
   */
  getMaskedConfig(): ProviderOverridesSnapshot {
    const config = this.applyOverrides(this.snapshot);
    return {
      ...config,
      serper: {
        ...config.serper,
        apiKey: maskApiKey(config.serper.apiKey),
      },
    };
  }

  /**
   * Drop all overrides of one provider — the effective config falls back
   * to the pristine env defaults (including the env API key).
   */
  resetConfig(provider: string): void {
    delete this.overrides[provider];
  }

  updateConfig(patch: Partial<Record<string, Record<string, any>>>): void {
    for (const [provider, values] of Object.entries(patch)) {
      if (!values) continue;
      if (!this.overrides[provider]) {
        this.overrides[provider] = {};
      }
      for (const [key, val] of Object.entries(values)) {
        if (key === 'apiKey') {
          this.updateApiKeyOverride(provider, val);
          continue;
        }
        this.overrides[provider][key] = val;
      }
    }
  }

  /**
   * API key patch rules: a masked-looking value is ignored (it is the
   * display form, not a key); an empty value clears the override so the
   * env key applies again; anything else becomes the new override.
   */
  private updateApiKeyOverride(provider: string, value: unknown): void {
    if (isMaskedApiKey(value)) return;
    if (typeof value === 'string' && value.trim() === '') {
      delete this.overrides[provider].apiKey;
      return;
    }
    if (typeof value === 'string') {
      this.overrides[provider].apiKey = value.trim();
    }
  }

  private applyOverrides(
    snapshot: ProviderOverridesSnapshot,
  ): ProviderOverridesSnapshot {
    // Deep-copy the provider configs first — merging into the shared
    // snapshot object would permanently pollute the pristine env config.
    const result: ProviderOverridesSnapshot = {
      serper: { ...snapshot.serper },
    };
    for (const [provider, values] of Object.entries(this.overrides)) {
      if (!(provider in result)) continue;
      const target = result[
        provider as keyof ProviderOverridesSnapshot
      ] as Record<string, any>;
      for (const [key, val] of Object.entries(values)) {
        target[key] = val;
      }
    }
    return result;
  }
}
