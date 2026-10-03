import { collectProviderSources } from './collect-provider-sources.helper';
import { engineIsEnabled } from './engine-is-enabled.helper';
import type {
  ProviderOverrides,
  ProviderSessionOverrides,
  SearchSourceToggle,
} from './provider-overrides.types';

/**
 * Providers in the overrides snapshot that are not search engines — their
 * feature flags must not surface as search-source tags.
 */
const NON_SEARCH_PROVIDERS = new Set(['sources']);

/**
 * Search engines that expose a single on/off toggle instead of per-source
 * tags (EODHD). Their endpoint flags must not become source tags; the engine
 * gets one dedicated toggle in the prompt bar instead.
 */
const SINGLE_TOGGLE_PROVIDERS = new Set(['eodhd']);

/**
 * Every toggleable search source across the configured search engines
 * (web, images, news, …) with its effective enabled state, in snapshot
 * order and deduplicated — the tags shown at the top edge of the prompt
 * input. A source shared by several engines (e.g. videos) renders once and
 * lights up when any engine has it enabled; its toggle flips them all.
 * Enabled sources render colored, disabled ones gray; the user flips the
 * state by clicking the tag, so disabled sources stay visible (kill switch
 * off or no API key still hides the strip entirely). Session overrides win
 * over the snapshot, mirroring Settings. Any engine added to the
 * provider-overrides response is picked up automatically; non-search
 * providers are skipped.
 */
export function listSearchSources(
  snapshot: ProviderOverrides | null | undefined,
  sessionOverrides: ProviderSessionOverrides | null | undefined,
): SearchSourceToggle[] {
  const sources: SearchSourceToggle[] = [];
  if (!snapshot) return sources;
  for (const [provider, engine] of Object.entries(snapshot)) {
    if (NON_SEARCH_PROVIDERS.has(provider)) continue;
    if (SINGLE_TOGGLE_PROVIDERS.has(provider)) continue;
    // Only engines that are currently enabled surface their source tags — a
    // disabled engine's sources must not leak into the menu.
    if (!engineIsEnabled(snapshot, sessionOverrides, provider)) continue;
    collectProviderSources(provider, engine, sessionOverrides, sources);
  }
  return sources;
}
