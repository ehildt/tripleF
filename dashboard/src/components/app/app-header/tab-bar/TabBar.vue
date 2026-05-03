<script setup lang="ts">
import type { ActiveTab } from '../../../../stores/app';
import TabButton from '../../tab-button/TabButton.vue';
import type { HeaderTab } from '../composables/use-header-tabs';

interface Props {
  tabs: readonly HeaderTab[];
  activeTab: ActiveTab;
}

const emit = defineEmits<{
  tabChange: [tab: ActiveTab];
}>();

defineProps<Props>();
</script>

<template>
  <nav class="tab-bar" aria-label="Primary">
    <TabButton
      v-for="(tab, idx) in tabs"
      :key="tab.tab"
      :label="tab.label"
      :tab="tab.tab"
      :active-tab="activeTab"
      :count="tab.count"
      :show-star="tab.showStar"
      :tint="tab.tint"
      :class="idx > 0 ? 'tab-bar__separator' : ''"
      @click="emit('tabChange', tab.tab)"
    />
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 0;
  border: 1px solid var(--color-divider);
}

.tab-bar__separator {
  border-left: 1px solid var(--color-divider);
}
</style>
