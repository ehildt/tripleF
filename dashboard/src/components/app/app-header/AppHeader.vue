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
    <div class="app-header__container">
      <div class="app-header__inner">
        <NavMenu
          :tabs="tabs"
          :active-tab="activeTab"
          @tab-change="emit('tabChange', $event)"
        />

        <AppThemeSelector />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  border-bottom: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
}

.app-header__container {
  margin-left: auto;
  margin-right: auto;
  padding: 0.5rem 1rem;
}

@media (min-width: 640px) {
  .app-header__container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .app-header__container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-2);
}
</style>
