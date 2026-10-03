import type {
  ProviderOverrideEntry,
  ProviderOverrides,
} from './provider-overrides.types';

/**
 * The provider entry for a name inside a provider-overrides snapshot, or
 * undefined when absent or not an object.
 */
export function engineObject(
  snapshot: ProviderOverrides | null | undefined,
  name: string,
): ProviderOverrideEntry | undefined {
  const engine = snapshot?.[name];
  return engine && typeof engine === 'object' ? engine : undefined;
}
