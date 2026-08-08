import type { EngineSnapshot } from './engine-object.helper.types';

/**
 * The engine object for a provider name inside a provider-overrides
 * snapshot, or undefined when absent or not an object.
 */
export function engineObject(
  snapshot: Record<string, unknown> | null | undefined,
  name: string,
): EngineSnapshot | undefined {
  const engine = snapshot?.[name];
  return engine && typeof engine === 'object'
    ? (engine as EngineSnapshot)
    : undefined;
}
