<script setup lang="ts">
import HistoryListItem from './history-list-item/HistoryListItem.vue';
import type { HistoryListProps } from './HistoryList.types';

defineProps<HistoryListProps>();

const emit = defineEmits<{
  select: [index: number];
  copy: [index: number];
  toggleInclude: [index: number];
  toggleMerge: [index: number];
  deleteItem: [index: number];
  branchOut: [index: number];
}>();
</script>

<template>
  <div v-if="items.length" class="history-list">
    <HistoryListItem
      v-for="(item, index) in items"
      :key="item.id ?? index"
      :item="item"
      :active="item.id != null && item.id === activeId"
      :icon-visibility="iconVisibility"
      :can-merge="canMerge ?? false"
      :merge-armed="mergeArmed ?? false"
      @select="emit('select', index)"
      @copy="emit('copy', index)"
      @toggle-include="emit('toggleInclude', index)"
      @toggle-merge="emit('toggleMerge', index)"
      @delete-item="emit('deleteItem', index)"
      @branch-out="emit('branchOut', index)"
    />
  </div>
</template>

<style scoped>
.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
}
</style>
