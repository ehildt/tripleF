import { engineHasApiKey } from './engine-has-api-key.helper';

/** The search engines the chat master toggle controls. */
export const SEARCH_ENGINES = [
  'serper',
  'brightData',
  'youtube',
  'eodhd',
] as const;

/** Engines currently configured (a key is present server-side). */
export function configuredEngines(
  snapshot: Record<string, unknown> | null | undefined,
): readonly string[] {
  return SEARCH_ENGINES.filter((name) => engineHasApiKey(snapshot, name));
}
