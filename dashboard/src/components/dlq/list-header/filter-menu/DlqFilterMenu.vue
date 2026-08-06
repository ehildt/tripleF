<script setup lang="ts">
import { Check } from '@lucide/vue';
import type { Component } from 'vue';

import MotionIcon from '../../../shared/ui/motion-icon/MotionIcon.vue';

defineProps<{
  isOpen: boolean;
  isActive: boolean;
  icon: Component;
  title: string;
  width: string;
  options: readonly string[];
  selectedValue: string;
  hasTextValue?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'select', value: string): void;
}>();
</script>

<template>
  <div class="dlq-filter-menu">
    <button
      class="dlq-filter-menu__trigger"
      :class="{
        'dlq-filter-menu__trigger--active': isOpen || isActive,
      }"
      :title="title"
      @click.stop="emit('toggle')"
    >
      <MotionIcon>
        <component :is="icon" class="dlq-filter-menu__trigger-icon" />
      </MotionIcon>
    </button>
    <div
      v-if="isOpen"
      class="dlq-filter-menu__dropdown"
      :style="{ width }"
      @click.stop
    >
      <template v-if="hasTextValue">
        <div class="dlq-filter-menu__search">
          <input
            :value="selectedValue"
            name="dlq-filter"
            :placeholder="title"
            class="dlq-filter-menu__search-input"
            @input="emit('select', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </template>
      <template v-else>
        <button
          v-for="option in options"
          :key="option"
          class="dlq-filter-menu__option"
          :class="{
            'dlq-filter-menu__option--selected': selectedValue === option,
          }"
          @click="emit('select', option)"
        >
          <span class="dlq-filter-menu__option-label">{{ option }}</span>
          <Check
            v-if="selectedValue === option"
            class="dlq-filter-menu__option-check"
          />
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dlq-filter-menu {
  position: relative;
}

.dlq-filter-menu__trigger {
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

.dlq-filter-menu__trigger:hover {
  color: var(--color-accent-primary);
}

.dlq-filter-menu__trigger--active {
  color: var(--color-accent-primary);
}

.dlq-filter-menu__trigger-icon {
  width: 1rem;
  height: 1rem;
}

.dlq-filter-menu__dropdown {
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

.dlq-filter-menu__option {
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

.dlq-filter-menu__option:hover {
  background-color: var(--color-bg-tertiary);
}

.dlq-filter-menu__option--selected {
  color: var(--color-accent-primary);
}

.dlq-filter-menu__option-label {
  flex: 1;
  text-align: left;
}

.dlq-filter-menu__option-check {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.dlq-filter-menu__search {
  padding: var(--spacing-2);
}

.dlq-filter-menu__search-input {
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

.dlq-filter-menu__search-input::placeholder {
  color: var(--color-fg-muted);
}

.dlq-filter-menu__search-input:focus {
  border-color: var(--color-accent-primary);
}
</style>
