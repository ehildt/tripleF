import { computed, ref, watch } from 'vue';

import type { ProviderKey } from '../sysctl-config.model';

const LOCAL_STORAGE_KEY = 'sysctl-selected-provider';

const ORDERED_PROVIDERS: ProviderKey[] = [
  'serper',
  'brave',
  'searxng',
  'browserBase',
];

function loadSavedProvider(): ProviderKey | null {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  return ORDERED_PROVIDERS.includes(raw as ProviderKey)
    ? (raw as ProviderKey)
    : null;
}

function saveProvider(provider: ProviderKey) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, provider);
  } catch {
    /* ignore */
  }
}

function pickInitialProvider(
  configured: Record<ProviderKey, boolean>,
): ProviderKey {
  const saved = loadSavedProvider();
  if (saved && configured[saved]) return saved;
  return ORDERED_PROVIDERS.find((p) => configured[p]) ?? 'serper';
}

export function useSysctlProviderSelection(
  configured: () => Record<ProviderKey, boolean>,
) {
  const resolvedInitialProvider = computed(() =>
    pickInitialProvider(configured()),
  );

  const selectedProvider = ref<ProviderKey>(resolvedInitialProvider.value);

  watch(
    resolvedInitialProvider,
    (next) => {
      selectedProvider.value = next;
    },
    { immediate: true },
  );

  function selectProvider(provider: ProviderKey) {
    selectedProvider.value = provider;
    saveProvider(provider);
  }

  const orderedProviders = computed(() => ORDERED_PROVIDERS);

  return {
    selectedProvider: computed(() => selectedProvider.value),
    orderedProviders,
    selectProvider,
  };
}
