<script setup lang="ts">
import { Check } from '@lucide/vue';

import MotionIcon from '../motion-icon/MotionIcon.vue';
import Tooltip from '../tooltip/Tooltip.vue';

defineProps<{
  isOpen: boolean;
  isActive: boolean;
  title: string;
  width: string;
  options: readonly { value: string; label: string }[];
  selectedValue: string;
  hasTextValue?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'select', value: string): void;
}>();
</script>

<template>
  <div class="filter-menu">
    <Tooltip :text="title">
      <button
        class="filter-menu__trigger"
        :class="{
          'filter-menu__trigger--active': isOpen || isActive,
        }"
        :aria-label="title"
        @click.stop="emit('toggle')"
      >
        <MotionIcon>
          <span class="filter-menu__trigger-icon">
            <slot />
          </span>
        </MotionIcon>
      </button>
    </Tooltip>
    <div
      v-if="isOpen"
      class="filter-menu__dropdown"
      :style="{ width }"
      @click.stop
    >
      <template v-if="hasTextValue">
        <div class="filter-menu__search">
          <input
            :value="selectedValue"
            name="filter-menu"
            :placeholder="title"
            class="filter-menu__search-input"
            @input="emit('select', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </template>
      <template v-else>
        <button
          v-for="option in options"
          :key="option.value"
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
      </template>
    </div>
  </div>
</template>

<style scoped>
.filter-menu {
  position: relative;
}

.filter-menu__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.filter-menu__trigger:hover {
  color: var(--color-accent-primary);
}

.filter-menu__trigger--active {
  color: var(--color-accent-primary);
}

.filter-menu__trigger-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}

.filter-menu__trigger-icon :deep(svg) {
  width: 1rem;
  height: 1rem;
}

.filter-menu__dropdown {
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  margin-top: var(--spacing-1);
  z-index: 50;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}

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

.filter-menu__search {
  padding: var(--spacing-1);
}

.filter-menu__search-input {
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

.filter-menu__search-input::placeholder {
  color: var(--color-fg-muted);
}

.filter-menu__search-input:focus {
  border-color: var(--color-accent-primary);
}
</style>
