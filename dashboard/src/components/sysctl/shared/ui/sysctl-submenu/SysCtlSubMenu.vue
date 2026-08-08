<script setup lang="ts">
/**
 * Generic right-aligned submenu bar for the SysCtl tabs: one button per
 * sub-section, so users can jump straight to the panel they want instead of
 * scrolling through every collapsible panel. Mirrors the search-engines
 * submenu styling.
 */
import type { SubMenuItem } from './SysCtlSubMenu.types';

defineProps<{
  items: SubMenuItem[];
  active: string;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <div class="sysctl-submenu" role="tablist">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="active === item.id"
      class="sysctl-submenu__tab"
      :class="{ 'sysctl-submenu__tab--active': active === item.id }"
      @click="emit('select', item.id)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.sysctl-submenu {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-1);
  flex-wrap: wrap;
  padding: var(--spacing-1);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
}

.sysctl-submenu__tab {
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

.sysctl-submenu__tab:hover {
  color: var(--color-fg-primary);
}

.sysctl-submenu__tab--active,
.sysctl-submenu__tab--active:hover {
  color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.sysctl-submenu__tab:focus {
  outline: none;
}

.sysctl-submenu__tab:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}
</style>
