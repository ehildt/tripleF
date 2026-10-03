import type { MirroredOverrides } from './build-mirrored-overrides.helper.types';
import type {
  ProviderOverrides,
  ProviderSessionOverrides,
  ProviderSourceEndpoint,
} from './provider-overrides.types';

/**
 * Produce copies of the snapshot and session overrides with the endpoint
 * merged under provider → source, leaving the originals untouched. Used to
 * optimistically mirror a source toggle into the local refs before the write
 * settles, so sibling endpoint keys survive the merge.
 */
export function buildMirroredOverrides(
  snapshot: ProviderOverrides | null | undefined,
  sessionOverrides: ProviderSessionOverrides | null | undefined,
  provider: string,
  source: string,
  endpoint: ProviderSourceEndpoint,
): MirroredOverrides {
  const nextSnapshot = { ...(snapshot ?? {}) };
  const engine = { ...nextSnapshot[provider] };
  engine[source] = {
    ...(engine[source] as ProviderSourceEndpoint),
    ...endpoint,
  };
  nextSnapshot[provider] = engine;

  const nextSession = { ...(sessionOverrides ?? {}) };
  const sessionEngine = { ...(nextSession[provider] ?? {}) };
  sessionEngine[source] = {
    ...(sessionEngine[source] as ProviderSourceEndpoint),
    ...endpoint,
  };
  nextSession[provider] = sessionEngine;

  return { snapshot: nextSnapshot, session: nextSession };
}
