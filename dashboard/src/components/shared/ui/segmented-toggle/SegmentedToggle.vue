<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';

/**
 * Icon-only segmented toggle: a row of joined buttons where exactly one is
 * active. Every button is icon + tooltip only (no text).
 */
defineProps<{
  options: readonly { value: string; icon: LucideIcon; tooltip: string }[];
  modelValue: string;
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <div class="segmented-toggle" role="group" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="segmented-toggle__button"
      :class="{
        'segmented-toggle__button--active': modelValue === option.value,
      }"
      :aria-pressed="modelValue === option.value"
      :title="option.tooltip"
      :aria-label="option.tooltip"
      @click="emit('update:modelValue', option.value)"
    >
      <component :is="option.icon" class="segmented-toggle__icon" />
    </button>
  </div>
</template>

<style scoped>
.segmented-toggle {
  flex-shrink: 0;
  display: flex;
}

.segmented-toggle__button {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--color-divider);
  background-color: transparent;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.segmented-toggle__button + .segmented-toggle__button {
  margin-left: -1px;
}

.segmented-toggle__button:hover {
  color: var(--color-fg-primary);
  border-color: var(--color-accent-border);
}

.segmented-toggle__button--active {
  position: relative;
  z-index: 1;
  color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.segmented-toggle__icon {
  width: 0.85rem;
  height: 0.85rem;
}
</style>
