/**
 * Reserved keys inside a search-engine config that are not toggleable
 * sources and must never become tags.
 */
const RESERVED_KEYS = new Set(['enabled', 'apiKey', 'webSearch']);

/**
 * Providers in the overrides snapshot that are not search engines — their
 * feature flags must not surface as search-source tags.
 */
const NON_SEARCH_PROVIDERS = new Set(['sources']);

type Overrides = Record<string, Record<string, unknown> | undefined>;

function isSourceToggle(value: unknown): value is { enabled: boolean } {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as { enabled?: unknown }).enabled === 'boolean'
  );
}

function sessionSourceEnabled(
  sessionOverrides: Overrides | null | undefined,
  provider: string,
  source: string,
): boolean | undefined {
  const value = sessionOverrides?.[provider]?.[source];
  return isSourceToggle(value) ? value.enabled : undefined;
}

function collectProviderSources(
  provider: string,
  engine: unknown,
  sessionOverrides: Overrides | null | undefined,
  sources: { key: string; enabled: boolean }[],
): void {
  if (!engine || typeof engine !== 'object') return;
  for (const [key, value] of Object.entries(
    engine as Record<string, unknown>,
  )) {
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

/**
 * Every toggleable search source across the configured search engines
 * (web, images, news, …) with its effective enabled state, in snapshot
 * order and deduplicated — the tags shown at the top edge of the prompt
 * input. A source shared by several engines (e.g. videos) renders once and
 * lights up when any engine has it enabled; its toggle flips them all.
 * Enabled sources render colored, disabled ones gray; the user flips the
 * state by clicking the tag, so disabled sources stay visible (kill switch
 * off or no API key still hides the strip entirely). Session overrides win
 * over the snapshot, mirroring SysCtl. Any engine added to the
 * provider-overrides response is picked up automatically; non-search
 * providers are skipped.
 */
export function listSearchSources(
  snapshot: Record<string, unknown> | null | undefined,
  sessionOverrides: Overrides | null | undefined,
): { key: string; enabled: boolean }[] {
  const sources: { key: string; enabled: boolean }[] = [];
  if (!snapshot) return sources;
  for (const [provider, engine] of Object.entries(snapshot)) {
    if (NON_SEARCH_PROVIDERS.has(provider)) continue;
    collectProviderSources(provider, engine, sessionOverrides, sources);
  }
  return sources;
}
