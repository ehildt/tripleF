<script setup lang="ts">
import type { ActiveTab } from '../../../stores/app';
import AppThemeSelector from '../app-theme-selector/AppThemeSelector.vue';
import { useHeaderTabs } from './composables/use-header-tabs';
import NavMenu from './nav-menu/NavMenu.vue';

const props = defineProps<{
  activeTab: ActiveTab;
  debugCount: number;
  showChatStar?: boolean;
  dlqCount?: number;
}>();

const emit = defineEmits<{
  tabChange: [tab: ActiveTab];
}>();

const { tabs } = useHeaderTabs(props);
</script>

<template>
  <header class="app-header">
    <div class="app-header__group">
      <NavMenu
        :tabs="tabs"
        :active-tab="activeTab"
        @tab-change="emit('tabChange', $event)"
      />

      <AppThemeSelector />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0.75rem;
  right: 1rem;
  z-index: 40;
}

@media (min-width: 640px) {
  .app-header {
    right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .app-header {
    right: 2rem;
  }
}

/* Floating frosted pill: keeps the controls legible over scrolling content
   without the old full-width header bar. */
.app-header__group {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-0-5) var(--spacing-1);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 50%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
