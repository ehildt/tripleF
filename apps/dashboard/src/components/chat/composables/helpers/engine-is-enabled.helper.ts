import { engineObject } from './engine-object.helper';
import type {
  ProviderOverrides,
  ProviderSessionOverrides,
} from './provider-overrides.types';

/**
 * A provider's effective enabled flag — the session override wins, then the
 * snapshot value.
 */
export function engineIsEnabled(
  snapshot: ProviderOverrides | null | undefined,
  sessionOverrides: ProviderSessionOverrides | null | undefined,
  name: string,
): boolean {
  const session = sessionOverrides?.[name];
  const sessionEnabled =
    session &&
    typeof session === 'object' &&
    typeof session.enabled === 'boolean'
      ? session.enabled
      : undefined;
  const snapshotEnabled = engineObject(snapshot, name)?.enabled === true;
  return sessionEnabled ?? snapshotEnabled;
}
