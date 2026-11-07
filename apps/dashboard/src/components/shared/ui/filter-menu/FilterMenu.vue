<script setup lang="ts">
import { Check } from '@lucide/vue';

import FilterMenuTrigger from '@/components/shared/ui/filter-menu-trigger/FilterMenuTrigger.vue';

import type { FilterMenuEmits, FilterMenuProps } from './FilterMenu.types';

defineProps<FilterMenuProps>();
const emit = defineEmits<FilterMenuEmits>();
</script>

<template>
  <FilterMenuTrigger
    :is-open="isOpen"
    :is-active="isActive"
    :title="title"
    :width="width"
    :icon="icon"
    @toggle="emit('toggle')"
    @close="emit('close')"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="filter-menu__option"
      :class="{
        'filter-menu__option--selected': selectedValue === option.value,
      }"
      @click="emit('select', option.value)"
    >
      <span class="filter-menu__option-label">{{ option.label }}</span>
      <Check
        v-if="selectedValue === option.value"
        class="filter-menu__option-check"
      />
    </button>
  </FilterMenuTrigger>
</template>

<style scoped>
.filter-menu__option {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  text-align: left;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  transition: background-color 0.2s ease;
}

.filter-menu__option:hover {
  background-color: var(--color-bg-tertiary);
}

.filter-menu__option--selected {
  color: var(--color-accent-primary);
}

.filter-menu__option-label {
  flex: 1;
  text-align: left;
}

.filter-menu__option-check {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}
</style>
