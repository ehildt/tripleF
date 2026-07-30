<script setup lang="ts">
/**
 * The section tab bar of the SysCtl panel: one icon per settings group
 * (search engines, preprocessing, widgets, system).
 */
import { Blocks, Cog, Radar, ScanEye } from '@lucide/vue';

import type { SysctlTab } from '../composables/use-sysctl-tab';

defineProps<{
  activeTab: SysctlTab;
}>();

const emit = defineEmits<{
  selectTab: [tab: SysctlTab];
}>();

const TAB_LABELS: { tab: SysctlTab; label: string; icon: typeof Cog }[] = [
  { tab: 'search-engines', label: 'Search Engines', icon: Radar },
  { tab: 'preprocessing', label: 'Preprocessing', icon: ScanEye },
  { tab: 'widgets', label: 'Widgets', icon: Blocks },
  { tab: 'system', label: 'System', icon: Cog },
];
</script>

<template>
  <div class="sysctl-menu" role="tablist">
    <button
      v-for="{ tab, label, icon } in TAB_LABELS"
      :key="tab"
      type="button"
      role="tab"
      :title="label"
      :aria-label="label"
      :aria-selected="activeTab === tab"
      class="sysctl-menu__tab"
      :class="{ 'sysctl-menu__tab--active': activeTab === tab }"
      @click="emit('selectTab', tab)"
    >
      <component :is="icon" class="sysctl-menu__tab-icon" />
    </button>
  </div>
</template>

<style scoped>
.sysctl-menu {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
}

.sysctl-menu__tab {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  color: var(--color-fg-muted);
  background-color: transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
  border-radius: var(--spacing-1);
}

.sysctl-menu__tab:hover {
  color: var(--color-fg-primary);
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
}

.sysctl-menu__tab--active,
.sysctl-menu__tab--active:hover {
  color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 16%,
    transparent
  );
}

.sysctl-menu__tab:focus {
  outline: none;
}

.sysctl-menu__tab:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.sysctl-menu__tab-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
</style>
