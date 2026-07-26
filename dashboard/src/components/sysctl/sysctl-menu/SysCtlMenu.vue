<script setup lang="ts">
/**
 * The section tab bar of the SysCtl panel: one tab per settings group
 * (search engines, preprocessing, interface, system).
 */
import type { SysctlTab } from '../composables/use-sysctl-tab';

defineProps<{
  activeTab: SysctlTab;
}>();

const emit = defineEmits<{
  selectTab: [tab: SysctlTab];
}>();

const TAB_LABELS: { tab: SysctlTab; label: string }[] = [
  { tab: 'search-engines', label: 'Search Engines' },
  { tab: 'preprocessing', label: 'Preprocessing' },
  { tab: 'widgets', label: 'Widgets' },
  { tab: 'interface', label: 'Interface' },
  { tab: 'system', label: 'System' },
];
</script>

<template>
  <div class="sysctl-menu" role="tablist">
    <button
      v-for="{ tab, label } in TAB_LABELS"
      :key="tab"
      type="button"
      role="tab"
      :aria-selected="activeTab === tab"
      class="sysctl-menu__tab"
      :class="{ 'sysctl-menu__tab--active': activeTab === tab }"
      @click="emit('selectTab', tab)"
    >
      {{ label }}
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
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
  color: var(--color-fg-muted);
  background-color: transparent;
  border: 1px solid var(--color-divider);
}

.sysctl-menu__tab:hover {
  color: var(--color-fg-primary);
  border-color: var(--color-accent-border);
}

.sysctl-menu__tab--active {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}
</style>
