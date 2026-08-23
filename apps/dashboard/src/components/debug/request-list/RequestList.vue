<script lang="ts" setup>
import type { DebugResult } from '../../../types/debug.model';
import RequestItem from './request-item/RequestItem.vue';

defineProps<{
  results: readonly DebugResult[];
  selectedResultId?: string;
  isRead: (id: string) => boolean;
}>();

defineEmits<{
  (e: 'select', result: DebugResult): void;
}>();
</script>

<template>
  <div class="request-list">
    <div
      v-for="result in results"
      :key="result.id"
      class="request-list__row"
      :class="{ 'request-list__row--active': selectedResultId === result.id }"
      @click="$emit('select', result)"
    >
      <RequestItem
        :result="result"
        :is-read="isRead(result.id)"
        :is-active="selectedResultId === result.id"
      />
    </div>
  </div>
</template>

<style scoped>
/* Fills the column panel (flex parent) and scrolls internally — the
   column wrapper in DebugSection owns the shared panel height. */
.request-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.request-list__row {
  border-bottom: 1px solid var(--color-divider);
  cursor: pointer;
}

.request-list__row:hover {
  background-color: color-mix(
    in srgb,
    var(--color-bg-tertiary) 50%,
    transparent
  );
}

.request-list__row--active,
.request-list__row--active:hover {
  background-color: var(--color-bg-tertiary);
}
</style>
