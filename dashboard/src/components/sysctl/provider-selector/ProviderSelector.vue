<script setup lang="ts">
import { computed } from 'vue';

import BraveProviderIcon from '../shared/ui/provider-icon/brave-provider-icon/BraveProviderIcon.vue';
import BrowserbaseProviderIcon from '../shared/ui/provider-icon/browserbase-provider-icon/BrowserbaseProviderIcon.vue';
import SearxngProviderIcon from '../shared/ui/provider-icon/searxng-provider-icon/SearxngProviderIcon.vue';
import SerperProviderIcon from '../shared/ui/provider-icon/serper-provider-icon/SerperProviderIcon.vue';
import type { ProviderKey } from '../sysctl-config.model';

type ProviderIcon =
  | typeof SerperProviderIcon
  | typeof BraveProviderIcon
  | typeof SearxngProviderIcon
  | typeof BrowserbaseProviderIcon;

const PROVIDER_META: {
  key: ProviderKey;
  title: string;
  component: ProviderIcon;
}[] = [
  { key: 'serper', title: 'Serper', component: SerperProviderIcon },
  { key: 'brave', title: 'Brave', component: BraveProviderIcon },
  { key: 'searxng', title: 'SearXNG', component: SearxngProviderIcon },
  {
    key: 'browserBase',
    title: 'Browserbase',
    component: BrowserbaseProviderIcon,
  },
];

const props = defineProps<{
  selectedProvider: ProviderKey;
  configuredProviders?: Record<ProviderKey, boolean>;
  enabledProviders?: Record<ProviderKey, boolean>;
}>();

const visibleProviders = computed(() => PROVIDER_META);

const emit = defineEmits<{
  selectProvider: [provider: ProviderKey];
}>();

function isAvailable(provider: ProviderKey): boolean {
  return Boolean(
    props.configuredProviders?.[provider] && props.enabledProviders?.[provider],
  );
}

function handleClick(provider: ProviderKey) {
  if (isAvailable(provider)) emit('selectProvider', provider);
}
</script>

<template>
  <div class="provider-selector">
    <button
      v-for="meta in visibleProviders"
      :key="meta.key"
      type="button"
      class="provider-selector__button"
      :class="{
        'provider-selector__button--active': selectedProvider === meta.key,
        'provider-selector__button--disabled': !isAvailable(meta.key),
      }"
      :disabled="!isAvailable(meta.key)"
      :title="meta.title"
      @click="handleClick(meta.key)"
    >
      <component :is="meta.component" :active="selectedProvider === meta.key" />
    </button>
  </div>
</template>

<style scoped>
.provider-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.provider-selector__button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  border-radius: 0.25rem;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.provider-selector__button:hover:not(.provider-selector__button--disabled) {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.provider-selector__button--active:not(.provider-selector__button--disabled) {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.provider-selector__button--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
