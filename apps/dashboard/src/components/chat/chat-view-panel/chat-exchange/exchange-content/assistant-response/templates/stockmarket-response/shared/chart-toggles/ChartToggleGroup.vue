<script setup lang="ts" generic="T extends string">
import ChartToggle from './ChartToggle.vue';
import type { ChartToggleOption } from './ChartToggleGroup.types';

defineProps<{
  /** Accessible name for the group (e.g. "Price style"). */
  groupLabel: string;
  /** Options rendered left to right. */
  options: ChartToggleOption<T>[];
  /** Active option id (`v-model`). */
  modelValue: T;
  /** Disables every toggle in the group (and hides the active state). */
  disabled?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
</script>

<template>
  <div class="chart-toggle-group" role="group" :aria-label="groupLabel">
    <ChartToggle
      v-for="option in options"
      :key="option.id"
      :active="!disabled && modelValue === option.id"
      :disabled="disabled"
      :label="$t(option.labelKey)"
      :icon="option.icon"
      @click="emit('update:modelValue', option.id)"
    />
  </div>
</template>

<style scoped>
.chart-toggle-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}
</style>
