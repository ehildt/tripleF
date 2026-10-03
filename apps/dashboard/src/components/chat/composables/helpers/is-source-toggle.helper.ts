import type { ProviderSourceEndpoint } from './provider-overrides.types';

/**
 * Whether a provider-overrides value is a source toggle descriptor: an object
 * carrying a boolean `enabled` flag. Type guard, so callers can read
 * `.enabled` without re-checking the shape.
 */
export function isSourceToggle(
  value: unknown,
): value is ProviderSourceEndpoint & { enabled: boolean } {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as { enabled?: unknown }).enabled === 'boolean'
  );
}
