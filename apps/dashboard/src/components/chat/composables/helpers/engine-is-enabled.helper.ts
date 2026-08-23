import { engineObject } from './engine-object.helper';

/**
 * A provider's effective enabled flag — the session override wins, then the
 * snapshot value.
 */
export function engineIsEnabled(
  snapshot: Record<string, unknown> | null | undefined,
  sessionOverrides:
    Record<string, Record<string, unknown> | undefined> | null | undefined,
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
