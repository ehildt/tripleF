import { computed, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { fetchConfig, saveConfig } from '@/api/config.api';
import { i18n } from '@/i18n/i18n';
import { getPersistentSocketSessionId } from '@/stores/helpers/socket/get-persistent-socket-session-id.helper';

import { useToast } from '../../../composables/use-toast';
import type { SearchEngineState } from '../shared/composables/use-search-engine-availability.types';
import { buildMirroredOverrides } from './helpers/build-mirrored-overrides.helper';
import { configuredEngines } from './helpers/configured-engines.helper';
import { engineIsEnabled } from './helpers/engine-is-enabled.helper';
import { listSearchSources } from './helpers/list-search-sources.helper';
import { mergeSourceEndpoint } from './helpers/merge-source-endpoint.helper';
import type {
  ProviderOverrides,
  ProviderSessionOverrides,
  ProviderSourceEndpoint,
} from './helpers/provider-overrides.types';
import { resolveSourceTargets } from './helpers/resolve-source-targets.helper';

/** The search-engine configuration is app-level state: the prompt action
 *  bar binds the raw toggles while its data composable derives the source
 *  tags and titles from the same snapshot, so the refs are module-scope and
 *  every caller shares one instance (a deliberate singleton, like the prompt
 *  draft). */
const hasApiKey = ref(false);
const isEnabled = ref(false);
const isLoaded = ref(false);
const isToggling = ref(false);
const snapshotConfig = ref<ProviderOverrides | null>(null);
const sessionOverrides = ref<ProviderSessionOverrides | null>(null);

/**
 * Whether the assistant currently has a search engine at its disposal, plus
 * the kill switch to toggle it from the chat view.
 *
 * Reads the masked provider-overrides snapshot (a masked `apiKey` proves a
 * key is configured server-side) across every search engine and merges the
 * session-persisted `*.enabled` override, mirroring how Settings applies each
 * toggle. Search counts as enabled when at least one configured engine is
 * on. The master toggle writes `enabled` for ALL configured engines (Serper,
 * Bright Data, YouTube) to both the server overrides and the session
 * overrides — the same pair Settings writes — so every view stays consistent.
 * The state is `unknown` while loading or after a failed fetch so the UI
 * does not flash a wrong indicator.
 */
export function useSearchEngineAvailability() {
  const toast = useToast();

  /** Every toggleable search source (web, images, news, …) + its state. */
  const searchSources = computed(() =>
    listSearchSources(snapshotConfig.value, sessionOverrides.value),
  );

  const searchEngineState = computed<SearchEngineState>(() => {
    if (!isLoaded.value) return 'unknown';
    if (!hasApiKey.value) return 'unavailable';
    return isEnabled.value ? 'enabled' : 'disabled';
  });

  /**
   * EODHD's own on/off state — a single engine, toggled by its Landmark.
   * `available` mirrors the engine's effective enabled flag (session
   * override wins over the snapshot), so the Landmark icon only shows while
   * EODHD is enabled; the toggle is inert until a key is configured.
   */
  const eodhdState = computed(() => {
    const snapshot = snapshotConfig.value;
    const enabled = engineIsEnabled(snapshot, sessionOverrides.value, 'eodhd');
    return { available: enabled, enabled };
  });

  async function refresh() {
    try {
      const [res, sessionConfig] = await Promise.all([
        fetch(getApiUrl('/api/v1/provider-overrides')),
        fetchConfig(getPersistentSocketSessionId()),
      ]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const snapshot = (await res.json()) as ProviderOverrides;
      const overridesConfig = (sessionConfig?.providerOverrides ??
        null) as ProviderSessionOverrides | null;
      const configured = configuredEngines(snapshot);
      hasApiKey.value = configured.length > 0;
      // Search counts as on when at least one configured engine is enabled.
      isEnabled.value =
        configured.length > 0 &&
        configured.some((name) =>
          engineIsEnabled(snapshot, overridesConfig, name),
        );
      snapshotConfig.value = snapshot;
      sessionOverrides.value = overridesConfig;
      isLoaded.value = true;
    } catch {
      isLoaded.value = false;
    }
  }

  async function persistSessionEnabled(
    engines: readonly string[],
    enabled: boolean,
  ) {
    const sessionId = getPersistentSocketSessionId();
    const config = await fetchConfig(sessionId);
    const overrides = {
      ...(config?.providerOverrides ?? {}),
    } as ProviderSessionOverrides;
    for (const name of engines) {
      overrides[name] = { ...overrides[name], enabled };
    }
    await saveConfig(sessionId, { providerOverrides: overrides });
    sessionOverrides.value = overrides;
  }

  /**
   * Toggle one search source (web, images, news, …) from the prompt-bar
   * tags — same dual write as the kill switch and Settings source toggles
   * (server overrides + session config), so the setting survives reloads
   * and server restarts. Only the engines that currently have the source
   * enabled are flipped (or, when none are, the primary engine is turned
   * on); engines that had the source off stay as-is. The change is
   * persisted per-engine in the database-backed session config.
   */
  async function toggleSource(source: string) {
    if (isToggling.value) return;
    const providers = resolveSourceTargets(
      snapshotConfig.value,
      sessionOverrides.value,
      source,
    );
    if (!providers.length) return;
    // Spread each endpoint so sibling settings (results, …) survive the
    // toggle — a bare {enabled} write would drop them.
    const previous = providers.some(
      (provider) =>
        mergeSourceEndpoint(
          snapshotConfig.value,
          sessionOverrides.value,
          provider,
          source,
        ).enabled === true,
    );
    const next = !previous;
    const nextEndpoints = Object.fromEntries(
      providers.map((provider) => [
        provider,
        {
          ...mergeSourceEndpoint(
            snapshotConfig.value,
            sessionOverrides.value,
            provider,
            source,
          ),
          enabled: next,
        },
      ]),
    );
    const backupSnapshot = snapshotConfig.value;
    const backupSession = sessionOverrides.value;
    for (const [provider, endpoint] of Object.entries(nextEndpoints)) {
      const mirrored = buildMirroredOverrides(
        snapshotConfig.value,
        sessionOverrides.value,
        provider,
        source,
        endpoint,
      );
      snapshotConfig.value = mirrored.snapshot;
      sessionOverrides.value = mirrored.session;
    }
    isToggling.value = true;
    try {
      const res = await fetch(getApiUrl('/api/v1/provider-overrides'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          Object.fromEntries(
            Object.entries(nextEndpoints).map(([provider, endpoint]) => [
              provider,
              { [source]: endpoint },
            ]),
          ),
        ),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const sessionId = getPersistentSocketSessionId();
      const config = await fetchConfig(sessionId);
      const overrides = {
        ...(config?.providerOverrides ?? {}),
      } as ProviderSessionOverrides;
      for (const provider of providers) {
        const existing = (overrides[provider]?.[source] ??
          {}) as ProviderSourceEndpoint;
        overrides[provider] = {
          ...overrides[provider],
          [source]: { ...existing, enabled: next },
        };
      }
      await saveConfig(sessionId, { providerOverrides: overrides });
      sessionOverrides.value = overrides;
    } catch {
      snapshotConfig.value = backupSnapshot;
      sessionOverrides.value = backupSession;
      toast.error(i18n.global.t('toast.failedUpdateSearchSource'));
    } finally {
      isToggling.value = false;
    }
  }

  async function toggleSearchEngine() {
    if (isToggling.value) return;
    if (
      searchEngineState.value !== 'enabled' &&
      searchEngineState.value !== 'disabled'
    ) {
      return;
    }
    const previous = isEnabled.value;
    const next = !previous;
    isEnabled.value = next;
    isToggling.value = true;
    try {
      // Flip every configured search engine together (Serper, Bright Data,
      // YouTube, EODHD) so the kill switch is a true master switch.
      const engines = configuredEngines(snapshotConfig.value);
      const res = await fetch(getApiUrl('/api/v1/provider-overrides'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          Object.fromEntries(engines.map((name) => [name, { enabled: next }])),
        ),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await persistSessionEnabled(engines, next);
    } catch {
      isEnabled.value = previous;
      toast.error(i18n.global.t('toast.failedUpdateSearchEngine'));
    } finally {
      isToggling.value = false;
    }
  }

  /**
   * Toggle only the EODHD stock-market engine from its Landmark icon — the
   * same dual write (server overrides + session config) as the master switch,
   * but scoped to EODHD alone.
   */
  async function toggleEodhd() {
    if (isToggling.value) return;
    if (!eodhdState.value.available) return;
    const next = !eodhdState.value.enabled;
    isToggling.value = true;
    try {
      const res = await fetch(getApiUrl('/api/v1/provider-overrides'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eodhd: { enabled: next } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await persistSessionEnabled(['eodhd'], next);
    } catch {
      toast.error(i18n.global.t('toast.failedUpdateSearchEngine'));
    } finally {
      isToggling.value = false;
    }
  }

  function reset() {
    hasApiKey.value = false;
    isEnabled.value = false;
    isLoaded.value = false;
    isToggling.value = false;
    snapshotConfig.value = null;
    sessionOverrides.value = null;
  }

  return {
    searchEngineState,
    searchSources,
    eodhdState,
    isToggling,
    refresh,
    toggleSearchEngine,
    toggleSource,
    toggleEodhd,
    reset,
  };
}
