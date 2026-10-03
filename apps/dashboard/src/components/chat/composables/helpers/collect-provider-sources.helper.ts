import { isSourceToggle } from './is-source-toggle.helper';
import type {
  ProviderSessionOverrides,
  SearchSourceToggle,
} from './provider-overrides.types';
import { sessionSourceEnabled } from './session-source-enabled.helper';

/**
 * Reserved keys inside a search-engine config that are not toggleable
 * sources and must never become tags.
 */
const RESERVED_KEYS = new Set(['enabled', 'apiKey', 'webSearch']);

/**
 * Fold every toggleable source on one engine into the accumulated `sources`
 * list: reserved keys are skipped, the session override wins over the
 * snapshot value, and a source already offered by another engine keeps a
 * single entry that lights up when any engine has it on.
 */
export function collectProviderSources(
  provider: string,
  engine: unknown,
  sessionOverrides: ProviderSessionOverrides | null | undefined,
  sources: SearchSourceToggle[],
): void {
  if (!engine || typeof engine !== 'object') return;
  for (const [key, value] of Object.entries(engine)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (!isSourceToggle(value)) continue;
    const enabled =
      sessionSourceEnabled(sessionOverrides, provider, key) ?? value.enabled;
    const existing = sources.find((entry) => entry.key === key);
    // Same source offered by several engines (e.g. videos on Serper and
    // YouTube): one tag, lit if any engine has it on. Toggling affects all.
    if (existing) {
      existing.enabled ||= enabled;
      continue;
    }
    sources.push({ key, enabled });
  }
}
