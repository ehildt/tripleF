import type {
  ProviderOverrides,
  ProviderSessionOverrides,
  ProviderSourceEndpoint,
} from './provider-overrides.types';

/**
 * The source's endpoint config with the session overrides merged over the
 * snapshot (session values win), mirroring how Settings applies each toggle.
 * Returns an empty object when neither side has the endpoint.
 */
export function mergeSourceEndpoint(
  snapshot: ProviderOverrides | null | undefined,
  sessionOverrides: ProviderSessionOverrides | null | undefined,
  provider: string,
  source: string,
): ProviderSourceEndpoint {
  const snapshotEndpoint = (snapshot?.[provider]?.[source] ??
    {}) as ProviderSourceEndpoint;
  const sessionEndpoint = (sessionOverrides?.[provider]?.[source] ??
    {}) as ProviderSourceEndpoint;
  return { ...snapshotEndpoint, ...sessionEndpoint };
}
