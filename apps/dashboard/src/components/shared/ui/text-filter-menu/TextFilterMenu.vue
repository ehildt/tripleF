<script setup lang="ts">
import FilterMenuTrigger from '@/components/shared/ui/filter-menu-trigger/FilterMenuTrigger.vue';

import type {
  TextFilterMenuEmits,
  TextFilterMenuProps,
} from './TextFilterMenu.types';

defineProps<TextFilterMenuProps>();
const emit = defineEmits<TextFilterMenuEmits>();
const searchValue = defineModel<string>({ required: true });
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
    <input
      v-model="searchValue"
      class="text-filter-menu__input"
      :placeholder="title"
      :aria-label="title"
    />
  </FilterMenuTrigger>
</template>

<style scoped>
.text-filter-menu__input {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  color: var(--color-fg-secondary);
  outline: none;
  transition: border-color 0.2s ease;
}

.text-filter-menu__input::placeholder {
  color: var(--color-fg-muted);
}

.text-filter-menu__input:focus {
  border-color: var(--color-accent-primary);
}
</style>
