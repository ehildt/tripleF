<script setup lang="ts">
import { computed } from 'vue';

import type { ActiveTab } from '../../../stores/app';
import AppThemeSelector from '../app-theme-selector/AppThemeSelector.vue';
import { calcTabColor } from '../shared/helpers/calc-tab-color.helper';
import AppBrand from './app-brand/AppBrand.vue';
import { useHeaderTabs } from './composables/use-header-tabs';
import TabBar from './tab-bar/TabBar.vue';

const props = defineProps<{
  activeTab: ActiveTab;
  blinkLogo: boolean;
  debugCount: number;
  showChatStar?: boolean;
  dlqCount?: number;
}>();

const emit = defineEmits<{
  tabChange: [tab: ActiveTab];
}>();

const { tabs, activeTabTint } = useHeaderTabs(props);

const tabColor = computed(() => calcTabColor(activeTabTint.value));
</script>

<template>
  <header class="app-header header-accent-gradient">
    <div class="app-header__container">
      <div class="app-header__inner">
        <AppBrand :tab-color="tabColor" :blink-logo="blinkLogo" />

        <TabBar
          :tabs="tabs"
          :active-tab="activeTab"
          @tab-change="emit('tabChange', $event)"
        />
      </div>
    </div>

    <div class="app-header__theme">
      <AppThemeSelector />
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
  max-width: 100rem;
  margin-left: auto;
  margin-right: auto;
  padding: 1rem 1rem;
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
  justify-content: space-between;
}

.app-header__theme {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

@media (min-width: 640px) {
  .app-header__theme {
    right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .app-header__theme {
    right: 2rem;
  }
}
</style>
