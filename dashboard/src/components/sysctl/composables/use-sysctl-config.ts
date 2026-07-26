import { onMounted, ref } from 'vue';

import { getApiUrl } from '../../../api/api-url';
import { useToast } from '../../../composables/use-toast';
import { clampSysctlResults } from '../helpers/clamp-sysctl-results.helper';
import type {
  ProviderConfig,
  ProviderKey,
  ProviderOverridesSnapshot,
} from '../sysctl-config.model';

const PROVIDER_OVERRIDES_KEY = 'provider-overrides';

function loadSavedOverrides(): Record<string, Record<string, unknown>> {
  try {
    return JSON.parse(localStorage.getItem(PROVIDER_OVERRIDES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveOverrides(patch: Record<string, Record<string, unknown>>) {
  const existing = loadSavedOverrides();
  for (const [provider, values] of Object.entries(patch)) {
    if (!existing[provider]) existing[provider] = {};
    for (const [key, val] of Object.entries(values)) {
      if (key === 'apiKey') continue;
      existing[provider][key] = val;
    }
  }
  try {
    localStorage.setItem(PROVIDER_OVERRIDES_KEY, JSON.stringify(existing));
  } catch {
    /* ignore */
  }
}

function clearSavedOverrides(provider: string) {
  const existing = loadSavedOverrides();
  delete existing[provider];
  try {
    localStorage.setItem(PROVIDER_OVERRIDES_KEY, JSON.stringify(existing));
  } catch {
    /* ignore */
  }
}

async function syncOverridesToServer(
  saved: Record<string, Record<string, unknown>>,
  snapshot: ProviderOverridesSnapshot,
) {
  for (const [provider, values] of Object.entries(saved)) {
    if (!(provider in snapshot)) continue;
    const target = snapshot[
      provider as keyof ProviderOverridesSnapshot
    ] as unknown as Record<string, unknown>;
    for (const [key, val] of Object.entries(values)) {
      if (key in target) target[key] = val;
    }
  }
  await fetch(getApiUrl('/api/v1/provider-overrides'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saved),
  });
}

function applyFrontendDefaults(
  snapshot: ProviderOverridesSnapshot,
): ProviderOverridesSnapshot {
  return {
    serper: { ...snapshot.serper, enabled: snapshot.serper.enabled ?? false },
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
      const res = await fetch(getApiUrl('/api/v1/provider-overrides'));
      const snapshot = applyFrontendDefaults(
        (await res.json()) as ProviderOverridesSnapshot,
      );
      const saved = loadSavedOverrides();
      if (Object.keys(saved).length > 0) {
        await syncOverridesToServer(saved, snapshot);
      }
      config.value = snapshot;
    } catch {
      hasError.value = true;
      toast.error('Failed to load config');
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Reset one provider to its env defaults: clears the locally persisted
   * overrides first (so a later refresh does not re-sync them), then asks
   * the server to drop its overrides and refreshes from the masked config
   * it returns.
   */
  async function resetProvider(provider: ProviderKey) {
    clearSavedOverrides(provider);
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
    saveOverrides(patch);
    await fetch(getApiUrl('/api/v1/provider-overrides'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
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
    toggleProviderEnabled,
    toggleEndpoint,
    updateEndpointResults,
    updateApiKey,
  };
}
