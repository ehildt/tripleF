import { engineObject } from './engine-object.helper';
import type { ProviderOverrides } from './provider-overrides.types';

/**
 * Whether a provider is configured: a (masked) apiKey is present server-side.
 */
export function engineHasApiKey(
  snapshot: ProviderOverrides | null | undefined,
  name: string,
): boolean {
  const apiKey = engineObject(snapshot, name)?.apiKey;
  return typeof apiKey === 'string' && apiKey.length > 0;
}
