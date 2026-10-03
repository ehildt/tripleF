<script setup lang="ts">
import { RadioTower } from '@lucide/vue';

import type { StreamModeToggleProps } from './StreamModeToggle.types';

defineProps<StreamModeToggleProps>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<template>
  <div class="stream-mode-toggle">
    <div class="stream-mode-toggle__row">
      <span class="stream-mode-toggle__icon-container">
        <RadioTower class="stream-mode-toggle__icon" />
      </span>
      <span class="stream-mode-toggle__label">{{ $t('common.stream') }}</span>
      <div class="stream-mode-toggle__toggle-group">
        <button
          type="button"
          class="stream-mode-toggle__toggle"
          :class="
            modelValue
              ? 'stream-mode-toggle__toggle--active'
              : 'stream-mode-toggle__toggle--inactive'
          "
          @click.stop="emit('update:modelValue', true)"
        >
          {{ $t('common.streamWord') }}
        </button>
        <button
          type="button"
          class="stream-mode-toggle__toggle"
          :class="
            !modelValue
              ? 'stream-mode-toggle__toggle--active'
              : 'stream-mode-toggle__toggle--inactive'
          "
          @click.stop="emit('update:modelValue', false)"
        >
          {{ $t('common.streamText') }}
        </button>
      </div>
    </div>
    <div class="stream-mode-toggle__description">
      <template v-if="modelValue">{{ $t('common.streamRealTime') }}</template>
      <template v-else>{{ $t('common.streamRendersOnce') }}</template>
    </div>
  </div>
</template>

<style scoped>
.stream-mode-toggle {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.stream-mode-toggle__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.stream-mode-toggle__icon-container {
  display: flex;
  align-items: center;
  padding: var(--spacing-1-5) 0;
  flex-shrink: 0;
}

.stream-mode-toggle__icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
}

.stream-mode-toggle__label {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.stream-mode-toggle__toggle-group {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.stream-mode-toggle__toggle {
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.stream-mode-toggle__toggle--active {
  background-color: var(--color-accent-primary);
  color: var(--color-fg-inverse);
}

.stream-mode-toggle__toggle--inactive {
  background-color: var(--color-bg-tertiary);
  color: var(--color-fg-muted);
  border: 1px solid var(--color-divider);
}

.stream-mode-toggle__toggle--inactive:hover {
  color: var(--color-accent-primary);
}

.stream-mode-toggle__description {
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  line-height: 1.25;
  user-select: none;
}
</style>
