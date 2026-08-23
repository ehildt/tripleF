import { engineObject } from './engine-object.helper';

/**
 * Whether a provider is configured: a (masked) apiKey is present server-side.
 */
export function engineHasApiKey(
  snapshot: Record<string, unknown> | null | undefined,
  name: string,
): boolean {
  const apiKey = engineObject(snapshot, name)?.apiKey;
  return typeof apiKey === 'string' && apiKey.length > 0;
}
