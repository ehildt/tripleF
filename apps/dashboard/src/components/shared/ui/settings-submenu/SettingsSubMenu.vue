<script setup lang="ts">
/**
 * Generic right-aligned submenu bar: one button per sub-section, so users
 * can jump straight to the panel they want instead of scrolling through
 * every collapsible panel. Shared styling for all Settings submenus.
 * Used by the Settings sections and the top-level Memory canvases page.
 */
import Tooltip from '../tooltip/Tooltip.vue';
import type { SubMenuItem } from './SettingsSubMenu.types';

defineProps<{
  items: SubMenuItem[];
  active: string;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <div class="settings-submenu" role="tablist">
    <Tooltip
      v-for="item in items"
      :key="item.id"
      :text="item.tooltip ?? item.label"
      max-width="18rem"
    >
      <button
        type="button"
        role="tab"
        :aria-label="item.label"
        :aria-selected="active === item.id"
        class="settings-submenu__tab"
        :class="{
          'settings-submenu__tab--active': active === item.id,
          'settings-submenu__tab--muted': item.muted,
        }"
        @click="emit('select', item.id)"
      >
        <component
          :is="item.icon"
          v-if="item.icon"
          class="settings-submenu__tab-icon"
        />
        <span v-else>{{ item.label }}</span>
      </button>
    </Tooltip>
  </div>
</template>

<style scoped>
.settings-submenu {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-1);
  flex-wrap: wrap;
  padding: var(--spacing-1);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
  padding: 0 var(--spacing-4);
}

.settings-submenu__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.875rem;
  height: 1.875rem;
  padding: 0 var(--spacing-1);
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

.settings-submenu__tab:hover {
  color: var(--color-fg-primary);
}

.settings-submenu__tab-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.settings-submenu__tab--active,
.settings-submenu__tab--active:hover {
  color: var(--color-accent-primary);
}

.settings-submenu__tab--muted {
  color: var(--color-fg-muted);
  opacity: 0.55;
}

.settings-submenu__tab--muted:hover {
  color: var(--color-fg-secondary);
  opacity: 0.8;
}

.settings-submenu__tab:focus {
  outline: none;
}

.settings-submenu__tab:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}
</style>
