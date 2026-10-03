import type { ProviderOverrides } from './provider-overrides.types';

/**
 * Every provider in the snapshot that offers the given source toggle, in
 * snapshot order. A provider counts when the source key is present on its
 * engine object, regardless of the toggle's current state.
 */
export function findSourceProviders(
  snapshot: ProviderOverrides | null | undefined,
  source: string,
): string[] {
  const providers: string[] = [];
  for (const [provider, engine] of Object.entries(snapshot ?? {})) {
    if (!engine || typeof engine !== 'object') continue;
    if (source in engine) providers.push(provider);
  }
  return providers;
}
