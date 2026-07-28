<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue';

import type { OllamaModel } from '../../../../../stores/models';

defineProps<{
  /** List of available models to display. */
  models: readonly OllamaModel[];
  /** Name string of the currently selected model. */
  selectedModel: string;
  /** Whether models are still loading. */
  loading: boolean;
}>();

defineEmits<{
  select: [model: string];
}>();
</script>

<template>
  <div class="model-list-content">
    <!-- Loading state -->
    <div v-if="loading" class="model-list-loading">
      <LoaderCircle class="model-list-loading__icon" />
      <span class="model-list-loading__text">Loading...</span>
    </div>

    <!-- Model list -->
    <template v-if="!loading">
      <button
        v-for="m in models"
        :key="m.model"
        class="model-list-item"
        :class="{ 'model-list-item--selected': m.model === selectedModel }"
        @click="$emit('select', m.model)"
      >
        <div class="model-list-item__info">
          <span>{{ m.model }}</span>
          <span
            class="model-list-item__meta"
            :class="{
              'model-list-item__meta--empty':
                !m.parameter_size && !m.quantization_level,
            }"
          >
            {{
              [m.parameter_size, m.quantization_level]
                .filter(Boolean)
                .join('  ')
            }}
          </span>
        </div>
      </button>
    </template>

    <!-- Empty state -->
    <div v-if="!models.length && !loading" class="model-list-empty">
      No models available
    </div>
  </div>
</template>

<style scoped>
.model-list-content {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
}

.model-list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) 0;
}

.model-list-loading__icon {
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
  color: var(--color-accent-primary);
}

.model-list-loading__text {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.model-list-item {
  padding: var(--spacing-1-5) var(--spacing-3);
  text-align: left;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  align-items: center;
  color: var(--color-fg-secondary);
  min-height: 2.5rem;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.model-list-item:hover {
  background-color: var(--color-bg-tertiary);
}

.model-list-item--selected {
  color: var(--color-accent-primary);
}

.model-list-item__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.model-list-item__meta {
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-list-item__meta--empty {
  visibility: hidden;
}

.model-list-empty {
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
}
</style>
