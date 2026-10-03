import { engineHasApiKey } from './engine-has-api-key.helper';
import type { ProviderOverrides } from './provider-overrides.types';

/** The search engines the chat master toggle controls. */
const SEARCH_ENGINES = ['serper', 'brightData', 'youtube', 'eodhd'] as const;

/** Engines currently configured (a key is present server-side). */
export function configuredEngines(
  snapshot: ProviderOverrides | null | undefined,
): readonly string[] {
  return SEARCH_ENGINES.filter((name) => engineHasApiKey(snapshot, name));
}
