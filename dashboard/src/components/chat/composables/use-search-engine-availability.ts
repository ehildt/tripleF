import { computed, onMounted, ref } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { fetchConfig, saveConfig } from '@/api/config.api';
import { getPersistentSocketSessionId } from '@/stores/helpers/get-persistent-socket-session-id.helper';

import { useToast } from '../../../composables/use-toast';
import { listSearchSources } from './list-search-sources.helper';

export type SearchEngineState =
  'unknown' | 'unavailable' | 'disabled' | 'enabled';

interface MaskedSerperSnapshot {
  enabled?: boolean;
  apiKey?: string;
}

/**
 * Whether the assistant currently has a search engine at its disposal, plus
 * the kill switch to toggle it from the chat view.
 *
 * Reads the masked provider-overrides snapshot (the masked `apiKey` proves a
 * key is configured server-side) and merges the session-persisted
 * `serper.enabled` override, mirroring how SysCtl applies the toggle. The
 * toggle writes both the server overrides and the session overrides — the
 * same pair SysCtl writes — so both views stay consistent. The state is
 * `unknown` while loading or after a failed fetch so the UI does not flash a
 * wrong indicator.
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

  async function refresh() {
    try {
      const [res, sessionConfig] = await Promise.all([
        fetch(getApiUrl('/api/v1/provider-overrides')),
        fetchConfig(getPersistentSocketSessionId()),
      ]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const snapshot = (await res.json()) as {
        serper?: MaskedSerperSnapshot;
      };
      const overridesConfig = (sessionConfig?.providerOverrides ??
        null) as Record<string, Record<string, unknown> | undefined> | null;
      const sessionEnabled = overridesConfig?.serper?.enabled as
        boolean | undefined;
      hasApiKey.value = !!snapshot.serper?.apiKey;
      isEnabled.value = sessionEnabled ?? snapshot.serper?.enabled ?? false;
      snapshotConfig.value = snapshot;
      sessionOverrides.value = overridesConfig;
      isLoaded.value = true;
    } catch {
      isLoaded.value = false;
    }
  }

  async function persistSessionEnabled(enabled: boolean) {
    const sessionId = getPersistentSocketSessionId();
    const config = await fetchConfig(sessionId);
    const overrides = {
      ...(config?.providerOverrides ?? {}),
    } as Record<string, Record<string, unknown>>;
    overrides.serper = { ...overrides.serper, enabled };
    await saveConfig(sessionId, { providerOverrides: overrides });
    sessionOverrides.value = overrides;
  }

  /** The engine that owns a given source toggle (first match wins). */
  function findSourceProvider(source: string): string | null {
    for (const [provider, engine] of Object.entries(
      snapshotConfig.value ?? {},
    )) {
      if (!engine || typeof engine !== 'object') continue;
      if (source in (engine as Record<string, unknown>)) return provider;
    }
    return null;
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
   * Toggle one search source (web, images, news, …) from the prompt-bar
   * tags — same dual write as the kill switch and SysCtl source toggles
   * (server overrides + session config), so the setting survives reloads
   * and server restarts. Disabled sources stay on the prompt bar in gray
   * and can be re-enabled with another click.
   */
  async function toggleSource(source: string) {
    if (isToggling.value) return;
    const provider = findSourceProvider(source);
    if (!provider) return;
    // Spread the current endpoint so sibling settings (results, …) survive
    // the toggle — a bare {enabled} write would drop them.
    const endpoint = sourceEndpoint(provider, source);
    const previous = endpoint.enabled === true;
    const next = !previous;
    const nextEndpoint = { ...endpoint, enabled: next };
    const backupSnapshot = snapshotConfig.value;
    const backupSession = sessionOverrides.value;
    mirrorSourceLocally(provider, source, nextEndpoint);
    isToggling.value = true;
    try {
      const res = await fetch(getApiUrl('/api/v1/provider-overrides'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [provider]: { [source]: nextEndpoint },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const sessionId = getPersistentSocketSessionId();
      const config = await fetchConfig(sessionId);
      const overrides = {
        ...(config?.providerOverrides ?? {}),
      } as Record<string, Record<string, unknown>>;
      const existing = (overrides[provider]?.[source] ?? {}) as Record<
        string,
        unknown
      >;
      overrides[provider] = {
        ...overrides[provider],
        [source]: { ...existing, enabled: next },
      };
      await saveConfig(sessionId, { providerOverrides: overrides });
      sessionOverrides.value = overrides;
    } catch {
      snapshotConfig.value = backupSnapshot;
      sessionOverrides.value = backupSession;
      toast.error('Failed to update search source');
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
    isEnabled.value = !previous;
    isToggling.value = true;
    try {
      const res = await fetch(getApiUrl('/api/v1/provider-overrides'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serper: { enabled: !previous } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await persistSessionEnabled(!previous);
    } catch {
      isEnabled.value = previous;
      toast.error('Failed to update search engine');
    } finally {
      isToggling.value = false;
    }
  }

  onMounted(refresh);

  return {
    searchEngineState,
    searchSources,
    isToggling,
    refresh,
    toggleSearchEngine,
    toggleSource,
  };
}
