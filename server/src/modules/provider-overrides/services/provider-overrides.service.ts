import { Injectable } from '@nestjs/common';

import type { BraveConfig } from '../../../configs/brave-config.adapter.js';
import { BraveConfigService } from '../../../configs/brave-config.service.js';
import type { BrowserBaseConfig } from '../../../configs/browser-base-config.adapter.js';
import { BrowserBaseConfigService } from '../../../configs/browser-base-config.service.js';
import type { SearXNGConfig } from '../../../configs/searxng-config.adapter.js';
import { SearXNGConfigService } from '../../../configs/searxng-config.service.js';
import type { SerperConfig } from '../../../configs/serper-config.adapter.js';
import { SerperConfigService } from '../../../configs/serper-config.service.js';

export interface ProviderOverridesSnapshot {
  serper: SerperConfig;
  brave: BraveConfig;
  searxng: SearXNGConfig;
  browserBase: BrowserBaseConfig;
}

@Injectable()
export class ProviderOverridesService {
  private snapshot: ProviderOverridesSnapshot;
  private overrides: Record<string, any> = {};

  constructor(
    private readonly serperCfg: SerperConfigService,
    private readonly braveCfg: BraveConfigService,
    private readonly searxngCfg: SearXNGConfigService,
    private readonly browserBaseCfg: BrowserBaseConfigService,
  ) {
    this.snapshot = {
      serper: this.serperCfg.config,
      brave: this.braveCfg.config,
      searxng: this.searxngCfg.config,
      browserBase: this.browserBaseCfg.config,
    };
  }

  getConfig(): ProviderOverridesSnapshot {
    return this.applyOverrides(this.snapshot);
  }

  updateConfig(patch: Partial<Record<string, Record<string, any>>>): void {
    for (const [provider, values] of Object.entries(patch)) {
      if (!values) continue;
      if (!this.overrides[provider]) {
        this.overrides[provider] = {};
      }
      for (const [key, val] of Object.entries(values)) {
        this.overrides[provider][key] = val;
      }
    }
  }

  private applyOverrides(
    snapshot: ProviderOverridesSnapshot,
  ): ProviderOverridesSnapshot {
    const result = { ...snapshot };
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
