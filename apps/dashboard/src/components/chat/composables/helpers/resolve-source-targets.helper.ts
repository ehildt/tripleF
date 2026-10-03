import { findSourceProviders } from './find-source-providers.helper';
import { mergeSourceEndpoint } from './merge-source-endpoint.helper';
import type {
  ProviderOverrides,
  ProviderSessionOverrides,
} from './provider-overrides.types';

/**
 * The engines a source toggle should affect: only the ones that currently
 * have that source enabled (so a toggle never flips an engine the user turned
 * off, e.g. Serper on + Bright Data off → toggling only affects Serper). When
 * the source is off everywhere, the toggle re-enables it on the primary
 * engine (Serper, else the first offering engine) so the tag can light back
 * up without unexpectedly re-enabling every engine.
 */
export function resolveSourceTargets(
  snapshot: ProviderOverrides | null | undefined,
  sessionOverrides: ProviderSessionOverrides | null | undefined,
  source: string,
): string[] {
  const offering = findSourceProviders(snapshot, source);
  const active = offering.filter(
    (provider) =>
      mergeSourceEndpoint(snapshot, sessionOverrides, provider, source)
        .enabled === true,
  );
  if (active.length) return active;
  return offering.includes('serper') ? ['serper'] : offering.slice(0, 1);
}
