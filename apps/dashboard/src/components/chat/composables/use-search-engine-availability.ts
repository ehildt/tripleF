import { computed, getCurrentInstance, onMounted, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { fetchConfig, saveConfig } from '@/api/config.api';
import { i18n } from '@/i18n/i18n';
import { getPersistentSocketSessionId } from '@/stores/helpers/socket/get-persistent-socket-session-id.helper';

import { useToast } from '../../../composables/use-toast';
import { configuredEngines } from './helpers/configured-engines.helper';
import { engineIsEnabled } from './helpers/engine-is-enabled.helper';
import { listSearchSources } from './list-search-sources.helper';
import type { SearchEngineState } from './use-search-engine-availability.types';

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

  const hasApiKey = ref(false);
  const isEnabled = ref(false);
  const isLoaded = ref(false);
  const isToggling = ref(false);
  const snapshotConfig = ref<Record<string, unknown> | null>(null);
  const sessionOverrides = ref<Record<
    string,
    Record<string, unknown> | undefined
  > | null>(null);

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
      const snapshot = (await res.json()) as Record<string, unknown>;
      const overridesConfig = (sessionConfig?.providerOverrides ??
        null) as Record<string, Record<string, unknown> | undefined> | null;
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
    } as Record<string, Record<string, unknown>>;
    for (const name of engines) {
      overrides[name] = { ...overrides[name], enabled };
    }
    await saveConfig(sessionId, { providerOverrides: overrides });
    sessionOverrides.value = overrides;
  }

  /** All engines that offer a given source toggle, in snapshot order. */
  function findSourceProviders(source: string): string[] {
    const providers: string[] = [];
    for (const [provider, engine] of Object.entries(
      snapshotConfig.value ?? {},
    )) {
      if (!engine || typeof engine !== 'object') continue;
      if (source in (engine as Record<string, unknown>))
        providers.push(provider);
    }
    return providers;
  }

  /** The source's endpoint config, session overrides merged over the snapshot. */
  function sourceEndpoint(
    provider: string,
    source: string,
  ): Record<string, unknown> {
    const snapshot = ((
      snapshotConfig.value?.[provider] as Record<string, unknown> | undefined
    )?.[source] ?? {}) as Record<string, unknown>;
    const session = (sessionOverrides.value?.[provider]?.[source] ??
      {}) as Record<string, unknown>;
    return { ...snapshot, ...session };
  }

  /** Optimistically mirror a source toggle into the local refs. */
  function mirrorSourceLocally(
    provider: string,
    source: string,
    endpoint: Record<string, unknown>,
  ) {
    const snapshot = { ...(snapshotConfig.value ?? {}) };
    const engine = { ...(snapshot[provider] as Record<string, unknown>) };
    engine[source] = {
      ...(engine[source] as Record<string, unknown>),
      ...endpoint,
    };
    snapshot[provider] = engine;
    snapshotConfig.value = snapshot;

    const session = { ...(sessionOverrides.value ?? {}) };
    const sessionEngine = { ...(session[provider] ?? {}) };
    sessionEngine[source] = {
      ...(sessionEngine[source] as Record<string, unknown>),
      ...endpoint,
    };
    session[provider] = sessionEngine;
    sessionOverrides.value = session;
  }

  /**
   * The engines a source toggle should affect: only the ones that currently
   * have that source enabled (so a toggle never flips an engine the user
   * turned off, e.g. Serper on + Bright Data off → toggling only affects
   * Serper). When the source is off everywhere, the toggle re-enables it on
   * the primary engine (Serper, else the first configured engine) so the
   * tag can light back up without unexpectedly re-enabling every engine.
   */
  function resolveSourceTargets(source: string): string[] {
    const offering = findSourceProviders(source);
    const active = offering.filter(
      (provider) => sourceEndpoint(provider, source).enabled === true,
    );
    if (active.length) return active;
    return offering.includes('serper') ? ['serper'] : offering.slice(0, 1);
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
    const providers = resolveSourceTargets(source);
    if (!providers.length) return;
    // Spread each endpoint so sibling settings (results, …) survive the
    // toggle — a bare {enabled} write would drop them.
    const previous = providers.some(
      (provider) => sourceEndpoint(provider, source).enabled === true,
    );
    const next = !previous;
    const nextEndpoints = Object.fromEntries(
      providers.map((provider) => [
        provider,
        { ...sourceEndpoint(provider, source), enabled: next },
      ]),
    );
    const backupSnapshot = snapshotConfig.value;
    const backupSession = sessionOverrides.value;
    for (const [provider, endpoint] of Object.entries(nextEndpoints)) {
      mirrorSourceLocally(provider, source, endpoint);
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
      } as Record<string, Record<string, unknown>>;
      for (const provider of providers) {
        const existing = (overrides[provider]?.[source] ?? {}) as Record<
          string,
          unknown
        >;
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

  // Load on mount only when consumed inside a component; bare callers
  // (tests, stores) drive refresh() explicitly.
  if (getCurrentInstance()) onMounted(refresh);

  return {
    searchEngineState,
    searchSources,
    eodhdState,
    isToggling,
    refresh,
    toggleSearchEngine,
    toggleSource,
    toggleEodhd,
  };
}
