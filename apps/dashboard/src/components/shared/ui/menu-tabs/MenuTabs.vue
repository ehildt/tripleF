<script setup lang="ts">
/**
 * A MenuRow of MenuButton tabs: one right-aligned 1rem-icon tab per item
 * over the shared fading underline — the same component drives the settings
 * panel's top tab menu (variant="header"), the settings sub tab menus, and
 * the /memory page strip (variant="section"). Callers own which items
 * render and what selecting one does; look and layout live in MenuRow and
 * MenuButton.
 */
import MenuButton from '../menu-button/MenuButton.vue';
import MenuRow from '../menu-row/MenuRow.vue';
import type { MenuTabsEmits, MenuTabsProps } from './MenuTabs.types';

defineProps<MenuTabsProps>();

const emit = defineEmits<MenuTabsEmits>();
</script>

<template>
  <MenuRow :variant="variant" role="tablist">
    <MenuButton
      v-for="item in items"
      :key="item.id"
      :label="item.label"
      :icon="item.icon"
      :tooltip="item.tooltip"
      :muted="item.muted"
      :selected="active === item.id"
      @click="emit('select', item.id)"
    />
  </MenuRow>
</template>
