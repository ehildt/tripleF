import { onMounted, ref } from 'vue';

import { getApiUrl } from '../../../api/api-url';
import { fetchConfig, saveConfig } from '../../../api/config.api';
import { useToast } from '../../../composables/use-toast';
import { getPersistentSocketSessionId } from '../../../stores/helpers/get-persistent-socket-session-id.helper';
import { clampSysctlResults } from '../helpers/clamp-sysctl-results.helper';
import type {
  ConfigSectionKey,
  ProviderConfig,
  ProviderKey,
  ProviderOverridesSnapshot,
} from '../sysctl-config.model';

const SESSION_ID = getPersistentSocketSessionId();

let sessionOverrides: Record<string, Record<string, unknown>> = {};

async function loadSessionOverrides(): Promise<
  Record<string, Record<string, unknown>>
> {
  try {
    const config = await fetchConfig(SESSION_ID);
    const overrides = config?.providerOverrides ?? {};
    return overrides as Record<string, Record<string, unknown>>;
  } catch {
    return {};
  }
}

function mergeSessionOverrides(
  snapshot: ProviderOverridesSnapshot,
): ProviderOverridesSnapshot {
  const result: ProviderOverridesSnapshot = { ...snapshot };
  for (const [provider, values] of Object.entries(sessionOverrides)) {
    const target = result[
      provider as keyof ProviderOverridesSnapshot
    ] as unknown as Record<string, unknown> | undefined;
    if (!target) continue;
    for (const [key, val] of Object.entries(values)) {
      if (key in target) target[key] = val;
    }
  }
  return result;
}

function saveSessionOverrides(patch: Record<string, Record<string, unknown>>) {
  for (const [provider, values] of Object.entries(patch)) {
    if (!sessionOverrides[provider]) sessionOverrides[provider] = {};
    for (const [key, val] of Object.entries(values)) {
      if (key === 'apiKey') continue;
      sessionOverrides[provider][key] = val;
    }
  }
}

function clearSessionOverrides(provider: string) {
  delete sessionOverrides[provider];
}

async function persistSessionOverrides() {
  await saveConfig(SESSION_ID, { providerOverrides: sessionOverrides });
}

function applyFrontendDefaults(
  snapshot: ProviderOverridesSnapshot,
): ProviderOverridesSnapshot {
  return {
    serper: { ...snapshot.serper, enabled: snapshot.serper.enabled ?? false },
    sources: {
      preferred: snapshot.sources?.preferred ?? [],
      blocked: snapshot.sources?.blocked ?? [],
    },
  };
}

export function useSysctlConfig() {
  const toast = useToast();

  const config = ref<ProviderOverridesSnapshot | null>(null);
  const isLoading = ref(true);
  const hasError = ref(false);

  async function refreshConfig() {
    isLoading.value = true;
    hasError.value = false;
    try {
      const [res, overrides] = await Promise.all([
        fetch(getApiUrl('/api/v1/provider-overrides')),
        loadSessionOverrides(),
      ]);
      sessionOverrides = overrides;
      const snapshot = applyFrontendDefaults(
        (await res.json()) as ProviderOverridesSnapshot,
      );
      config.value = mergeSessionOverrides(snapshot);
    } catch {
      hasError.value = true;
      toast.error('Failed to load config');
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Reset one provider to its env defaults: clears the session-persisted
   * overrides first (so a later refresh does not re-merge them), then asks
   * the server to drop its global overrides and refreshes from the masked
   * config it returns.
   */
  async function resetProvider(provider: ConfigSectionKey) {
    clearSessionOverrides(provider);
    await persistSessionOverrides();
    try {
      await fetch(getApiUrl(`/api/v1/provider-overrides/${provider}`), {
        method: 'DELETE',
      });
    } catch {
      toast.error('Failed to reset provider config');
    }
    await refreshConfig();
  }

  async function patchConfig(provider: string, path: string, value: unknown) {
    const patch = { [provider]: { [path]: value } };
    saveSessionOverrides(patch);
    await Promise.all([
      fetch(getApiUrl('/api/v1/provider-overrides'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }),
      persistSessionOverrides(),
    ]);
  }

  /**
   * Save a new API key for a provider. The key is never persisted to
   * localStorage and the server answers with the masked form only, so we
   * refresh the config to display the mask after saving.
   */
  async function updateApiKey(
    provider: ProviderKey,
    apiKey: string,
  ): Promise<boolean> {
    try {
      const res = await fetch(getApiUrl('/api/v1/provider-overrides'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [provider]: { apiKey } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refreshConfig();
      toast.success('API key saved');
      return true;
    } catch {
      toast.error('Failed to save API key');
      return false;
    }
  }

  function toggleProviderEnabled(provider: ProviderKey) {
    if (!config.value) return;
    const providerConfig = config.value[provider] as ProviderConfig & {
      enabled: boolean;
    };
    const next = !providerConfig.enabled;
    providerConfig.enabled = next;
    patchConfig(provider, 'enabled', next);
  }

  function toggleEndpoint(provider: ProviderKey, name: string) {
    if (!config.value) return;
    const providerConfig = config.value[provider] as Record<string, unknown>;
    const endpoint = providerConfig[name] as { enabled: boolean } | undefined;
    if (!endpoint || !('enabled' in endpoint)) return;
    const next = !endpoint.enabled;
    endpoint.enabled = next;
    patchConfig(provider, name, { ...endpoint, enabled: next });
  }

  function updateEndpointResults(
    provider: ProviderKey,
    name: string,
    rawValue: string,
    maxResults = 200,
  ) {
    if (!config.value) return;
    const providerConfig = config.value[provider] as Record<string, unknown>;
    const endpoint = providerConfig[name] as
      { enabled: boolean; results: number } | undefined;
    if (!endpoint || !('results' in endpoint)) return;
    const next = clampSysctlResults(Number(rawValue), maxResults);
    endpoint.results = next;
    patchConfig(provider, name, { ...endpoint, results: next });
  }

  onMounted(refreshConfig);

  return {
    config,
    isLoading,
    hasError,
    refreshConfig,
    resetProvider,
    patchConfig,
    toggleProviderEnabled,
    toggleEndpoint,
    updateEndpointResults,
    updateApiKey,
  };
}
