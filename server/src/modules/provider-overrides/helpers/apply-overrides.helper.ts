import type { ProviderOverridesSnapshot } from '../services/provider-overrides.service.js';

/**
 * Deep-copy the pristine env snapshot and merge the live overrides on top.
 * The copy is essential — merging into the shared snapshot object would
 * permanently pollute the pristine env config.
 */
export function applyOverrides(
  snapshot: ProviderOverridesSnapshot,
  overrides: Record<string, any>,
): ProviderOverridesSnapshot {
  const result: ProviderOverridesSnapshot = {
    serper: { ...snapshot.serper },
    brightData: { ...snapshot.brightData },
    sources: { ...snapshot.sources },
    layouts: { ...snapshot.layouts },
    youtube: { ...snapshot.youtube },
    eodhd: { ...snapshot.eodhd },
  };
  for (const [provider, values] of Object.entries(overrides)) {
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
