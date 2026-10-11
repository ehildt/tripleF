<script setup lang="ts" generic="T extends string">
import ChartToggle from './ChartToggle.vue';
import type { ChartToggleGroupProps } from './ChartToggleGroup.types';

defineProps<ChartToggleGroupProps<T>>();
const modelValue = defineModel<T>({ required: true });
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
      @click="modelValue = option.id"
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
