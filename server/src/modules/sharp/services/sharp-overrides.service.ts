import { Injectable } from '@nestjs/common';

import type { SharpDefaults } from '../configs/sharp-config.adapter.js';
import { SharpConfigService } from '../configs/sharp-config.service.js';
import type { SharpOptions } from '../dtos/sharp-options.dto.js';

/**
 * Partial patch for the preprocessing config. Each section merges into the
 * stored overrides independently, so a patch may touch a single parameter.
 */
export type SharpOverridesPatch = {
  enabled?: boolean;
  resize?: Partial<SharpDefaults['resize']>;
  variants?: Partial<SharpDefaults['variants']>;
  parameters?: Partial<SharpDefaults['parameters']>;
};

/**
 * In-memory preprocessing overrides layered over the env-backed sharp
 * defaults. The SysCtl preprocessing tab writes patches here; every harness
 * job resolves its preprocessing options from the effective config at
 * execution time, so the next query always uses the latest settings. No
 * database persistence by design — env vars remain the restart baseline.
 */
@Injectable()
export class SharpOverridesService {
  private overrides: SharpOverridesPatch = {};

  constructor(private readonly sharpConfig: SharpConfigService) {}

  /** The effective preprocessing config: env defaults + live overrides. */
  getConfig(): SharpDefaults {
    const defaults = this.sharpConfig.defaults;
    return {
      enabled: this.overrides.enabled ?? defaults.enabled,
      resize: { ...defaults.resize, ...this.overrides.resize },
      variants: { ...defaults.variants, ...this.overrides.variants },
      parameters: { ...defaults.parameters, ...this.overrides.parameters },
    };
  }

  updateConfig(patch: SharpOverridesPatch): void {
    this.overrides = {
      enabled: patch.enabled ?? this.overrides.enabled,
      resize: { ...this.overrides.resize, ...patch.resize },
      variants: { ...this.overrides.variants, ...patch.variants },
      parameters: { ...this.overrides.parameters, ...patch.parameters },
    };
  }

  /** Preprocessing options for the next job — undefined when disabled. */
  buildOptions(): SharpOptions | undefined {
    const config = this.getConfig();
    if (!config.enabled) return undefined;
    return {
      enabled: true,
      resize: config.resize,
      variants: config.variants,
      parameters: config.parameters,
    };
  }
}
