<script setup lang="ts">
import { Check } from '@lucide/vue';

import type { DropDownItemProps } from './DropDownItem.types';

defineProps<DropDownItemProps>();

const emit = defineEmits<{
  select: [option: string];
}>();
</script>

<template>
  <button
    class="drop-down-item"
    :class="{ 'drop-down-item--selected': selected }"
    @click="emit('select', option)"
  >
    <template v-if="showCheck">
      <Check v-if="selected" class="drop-down-item__check" />
      <span v-else class="drop-down-item__check-placeholder" />
    </template>
    {{ label }}
  </button>
</template>

<style scoped>
.drop-down-item {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  text-align: left;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-fg-secondary);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.drop-down-item:hover {
  background-color: var(--color-bg-tertiary);
}

.drop-down-item--selected {
  color: var(--color-accent-primary);
}

.drop-down-item__check {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.drop-down-item__check-placeholder {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}
</style>
