import { isSourceToggle } from './is-source-toggle.helper';
import type { ProviderSessionOverrides } from './provider-overrides.types';

/**
 * The session override for one provider source, or undefined when the session
 * config has no boolean toggle for it. When present it wins over the snapshot.
 */
export function sessionSourceEnabled(
  sessionOverrides: ProviderSessionOverrides | null | undefined,
  provider: string,
  source: string,
): boolean | undefined {
  const value = sessionOverrides?.[provider]?.[source];
  return isSourceToggle(value) ? value.enabled : undefined;
}
