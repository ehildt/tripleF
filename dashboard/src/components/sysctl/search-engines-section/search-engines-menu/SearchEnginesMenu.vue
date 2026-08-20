<script setup lang="ts">
/**
 * The submenu inside the SysCtl "Search Engines" tab: one button per engine
 * (and the sources list), so users can jump straight to the engine they want
 * to configure instead of scrolling through every collapsible panel.
 */
import { computed } from 'vue';

import { i18n } from '@/i18n/i18n';

import type { SearchEngineId } from './SearchEnginesMenu.types';

const ENGINES = computed<{ id: SearchEngineId; label: string }[]>(() => [
  { id: 'serper', label: i18n.global.t('common.serperApi') },
  { id: 'brightData', label: i18n.global.t('common.brightData') },
  { id: 'youtube', label: i18n.global.t('common.youtubeApi') },
  { id: 'eodhd', label: i18n.global.t('common.eodhdApi') },
  { id: 'sources', label: i18n.global.t('common.sources') },
]);

defineProps<{
  activeEngine: SearchEngineId;
}>();

const emit = defineEmits<{
  selectEngine: [id: SearchEngineId];
}>();
</script>

<template>
  <div class="search-engines-menu" role="tablist">
    <button
      v-for="engine in ENGINES"
      :key="engine.id"
      type="button"
      role="tab"
      :aria-selected="activeEngine === engine.id"
      class="search-engines-menu__tab"
      :class="{
        'search-engines-menu__tab--active': activeEngine === engine.id,
      }"
      @click="emit('selectEngine', engine.id)"
    >
      {{ engine.label }}
    </button>
  </div>
</template>

<style scoped>
.search-engines-menu {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-1);
  flex-wrap: wrap;
  padding: var(--spacing-1);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
}

.search-engines-menu__tab {
  padding: var(--spacing-1) var(--spacing-3);
  border: none;
  background: transparent;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 0;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.search-engines-menu__tab:hover {
  color: var(--color-fg-primary);
}

.search-engines-menu__tab--active,
.search-engines-menu__tab--active:hover {
  color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.search-engines-menu__tab:focus {
  outline: none;
}

.search-engines-menu__tab:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}
</style>
